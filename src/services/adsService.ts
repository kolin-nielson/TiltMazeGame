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
      await mobileAdsModule.MobileAds().initialize();
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
      // For Expo Go, always attempt to show the mock ad dialog.
      // If the ad wasn't "loaded", we'll consider it loaded now for the purpose of the dialog.
      if (!mockAdLoaded) {
        console.log('Mock rewarded ad was not pre-loaded, "loading" it now for dialog.');
        mockAdLoaded = true; // Ensure it's "loaded" for the dialog
      }

      mockRewardCallback = callback;

      // Show a mock ad dialog
      Alert.alert(
        'Mock Rewarded Ad (Expo Go)',
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
    return new Promise(async (resolve) => {
      // Function to attempt to show a loaded ad
      const attemptToShowAd = async () => {
        if (rewardedAd && isRewardedAdLoaded) {
          try {
            onRewardCallback = callback;
            await rewardedAd.show();
            resolve(true);
            return true;
          } catch (error) {
            console.error('Error showing rewarded ad:', error);
            onRewardCallback = null;
            // Try to load a new ad after error
            loadRewardedAd();
            resolve(false);
            return false;
          }
        }
        return false;
      };

      // First try - attempt to show an already loaded ad
      const adShown = await attemptToShowAd();
      if (adShown) return;

      console.log('Rewarded ad not ready, attempting to load one now...');
      
      // If not loaded, we'll try to load it and show once ready
      try {
        // Import modules directly in this scope
        const { RewardedAd, AdEventType, RewardedAdEventType } = await import('react-native-google-mobile-ads');
        
        // Get the appropriate ad unit ID
        const adUnitId = getAdUnitId('REWARDED');
        
        // Create a local reference to the rewarded ad
        const localRewardedAd = RewardedAd.createForAdRequest(adUnitId);
        
        // Track if the ad was loaded or if we timed out
        let wasAdLoaded = false;
        let wasTimeout = false;
        
        // Create a timeout promise
        const timeoutPromise = new Promise<void>((timeoutResolve) => {
          setTimeout(() => {
            if (!wasAdLoaded) {
              wasTimeout = true;
              console.log('Ad load timed out after 10 seconds');
              timeoutResolve();
            }
          }, 10000); // 10 second timeout
        });
        
        // Create a load promise
        const loadPromise = new Promise<void>((loadResolve) => {
          // Event listeners
          const unsubscribeLoaded = localRewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
            console.log('Rewarded ad loaded successfully!');
            wasAdLoaded = true;
            rewardedAd = localRewardedAd;
            isRewardedAdLoaded = true;
            loadResolve();
          });
          
          const unsubscribeFailedToLoad = localRewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
            console.error('Failed to load rewarded ad:', error);
            loadResolve(); // Resolve anyway to continue the flow
          });
          
          // Register callback for when ad is earned
          const unsubscribeEarned = localRewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
            console.log('User earned reward');
            if (onRewardCallback) {
              onRewardCallback();
              onRewardCallback = null;
            }
          });
          
          // Register callback for when ad is closed
          const unsubscribeClosed = localRewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
            isRewardedAdLoaded = false;
            rewardedAd = null;
            console.log('Rewarded ad closed');
            // Preload the next ad
            loadRewardedAd();
          });
          
          // Clean up function
          const cleanup = () => {
            unsubscribeLoaded();
            unsubscribeFailedToLoad();
            unsubscribeEarned();
            unsubscribeClosed();
          };
          
          // Load the ad
          localRewardedAd.load();
          
          // Return cleanup function
          return cleanup;
        });
        
        // Wait for either the ad to load or the timeout
        await Promise.race([loadPromise, timeoutPromise]);
        
        // Try showing the ad if it was loaded
        if (wasAdLoaded && !wasTimeout) {
          await attemptToShowAd();
        } else {
          // If we couldn't load the ad, resolve with false
          resolve(false);
        }
        
      } catch (error) {
        console.error('Error in ad loading process:', error);
        resolve(false);
      }
    });
  }
};
