import { Platform } from 'react-native';
import { Alert } from 'react-native';
import Constants from 'expo-constants';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Log the environment for debugging
console.log(`App environment: ${isExpoGo ? 'Expo Go' : 'Native/Production'}`);

// NOTE: For production builds, make sure the app.json file has the correct AdMob app IDs:
// - androidAppId: "ca-app-pub-4299404428269280~1234567890" (replace with your actual Android app ID)
// - iosAppId: "ca-app-pub-4299404428269280~0987654321" (replace with your actual iOS app ID)
// These are different from the ad unit IDs defined below.

// Mock implementation for Expo Go
let mockAdLoaded = false;
let mockRewardCallback: (() => void) | null = null;

// Real implementation for production builds
let rewardedAd: any = null;
let isRewardedAdLoaded = false;
let onRewardCallback: (() => void) | null = null;

// Define ad unit IDs
const AD_UNIT_IDS = {
  REWARDED: {
    // Real ad unit IDs for production
    ios: 'ca-app-pub-4299404428269280/4775290270',     // iOS Extra Life Reward
    android: 'ca-app-pub-4299404428269280/4205278782', // Android Extra Life Reward
  },
  // You can add more ad types here (banner, interstitial, etc.)
};

// Get the appropriate ad unit ID based on platform and environment
const getAdUnitId = (adType: keyof typeof AD_UNIT_IDS) => {
  // Import synchronously to avoid issues
  let TestIds: any;
  try {
    // This will only work in native builds, not in Expo Go
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    TestIds = require('react-native-google-mobile-ads').TestIds;
  } catch (e) {
    // In Expo Go, we'll use mock IDs
    TestIds = {
      REWARDED: 'test-rewarded',
    };
  }

  const platform = Platform.OS as 'ios' | 'android';

  // Use test IDs for development and real IDs for production
  // You can change this to false to test real ads in development
  const USE_TEST_IDS = __DEV__;

  if (USE_TEST_IDS) {
    console.log('Using test ad unit IDs');
    return TestIds.REWARDED;
  } else {
    console.log(`Using real ad unit ID for ${platform}`);
    return AD_UNIT_IDS[adType][platform];
  }
};

// Initialize the Mobile Ads SDK
export const initializeAds = async () => {
  if (isExpoGo) {
    console.log('Running in Expo Go - using mock ads implementation');
    // Simulate ad loading after a delay
    setTimeout(() => {
      mockAdLoaded = true;
      console.log('Mock rewarded ad loaded');
    }, 1000);
    return true;
  } else {
    try {
      // Dynamic import to avoid issues with Expo Go
      const mobileAdsModule = await import('react-native-google-mobile-ads');
      await mobileAdsModule.mobileAds().initialize();
      console.log('Mobile Ads SDK initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Mobile Ads SDK:', error);
      return false;
    }
  }
};

// Load a rewarded ad
export const loadRewardedAd = async () => {
  if (isExpoGo) {
    // Mock implementation for Expo Go
    setTimeout(() => {
      mockAdLoaded = true;
      console.log('Mock rewarded ad loaded');
    }, 1000);
    return () => {};
  } else {
    try {
      // Dynamic import to avoid issues with Expo Go
      const { RewardedAd, AdEventType, RewardedAdEventType } = await import('react-native-google-mobile-ads');

      // Get the appropriate ad unit ID
      const adUnitId = getAdUnitId('REWARDED');

      // Create and load the rewarded ad
      rewardedAd = RewardedAd.createForAdRequest(adUnitId);

      const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        isRewardedAdLoaded = true;
        console.log('Rewarded ad loaded');
      });

      const unsubscribeEarned = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        console.log('User earned reward');
        if (onRewardCallback) {
          onRewardCallback();
          onRewardCallback = null;
        }
      });

      const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        isRewardedAdLoaded = false;
        rewardedAd = null;
        console.log('Rewarded ad closed');
        // Preload the next ad
        loadRewardedAd();
      });

      const unsubscribeError = rewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.error('Rewarded ad error:', error);
        isRewardedAdLoaded = false;

        // Try to load another ad after error
        setTimeout(() => {
          loadRewardedAd();
        }, 5000);
      });

      // Load the ad
      rewardedAd.load();

      return () => {
        unsubscribeLoaded();
        unsubscribeEarned();
        unsubscribeClosed();
        unsubscribeError();
      };
    } catch (error) {
      console.error('Error loading rewarded ad:', error);
      return () => {};
    }
  }
};

// Show a rewarded ad
export const showRewardedAd = async (callback: () => void): Promise<boolean> => {
  if (isExpoGo) {
    // Mock implementation for Expo Go
    return new Promise((resolve) => {
      if (!mockAdLoaded) {
        console.log('Mock rewarded ad not ready yet');
        // Try to load a mock ad
        setTimeout(() => {
          mockAdLoaded = true;
          console.log('Mock rewarded ad loaded');
        }, 1000);
        resolve(false);
        return;
      }

      mockRewardCallback = callback;

      // Show a mock ad dialog
      Alert.alert(
        'Mock Rewarded Ad',
        'This is a mock rewarded ad for testing in Expo Go. Would you like to watch the ad to continue?',
        [
          {
            text: 'Cancel',
            onPress: () => {
              console.log('Mock ad canceled');
              mockRewardCallback = null;
              resolve(false);
            },
            style: 'cancel',
          },
          {
            text: 'Watch Ad',
            onPress: () => {
              // Simulate watching the ad
              setTimeout(() => {
                console.log('Mock ad completed');
                if (mockRewardCallback) {
                  mockRewardCallback();
                  mockRewardCallback = null;
                }
                // Reset mock ad state
                mockAdLoaded = false;
                // Reload the mock ad
                setTimeout(() => {
                  mockAdLoaded = true;
                  console.log('Mock rewarded ad loaded again');
                }, 1000);
                resolve(true);
              }, 1000);
            },
          },
        ],
        { cancelable: false }
      );
    });
  } else {
    // Real implementation for production builds
    if (!rewardedAd || !isRewardedAdLoaded) {
      console.log('Rewarded ad not ready yet');
      // Try to load a new ad
      loadRewardedAd();
      return false;
    }

    try {
      onRewardCallback = callback;
      await rewardedAd.show();
      return true;
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      onRewardCallback = null;
      // Try to load a new ad after error
      loadRewardedAd();
      return false;
    }
  }
};
