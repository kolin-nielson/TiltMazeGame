import { Platform, NativeModules } from 'react-native';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';

// Environment detection for ad serving
const isExpoGo = Constants.appOwnership === 'expo';
const isDevEnvironment = __DEV__;

// Determine device type (simulator vs real device)
const isSimulator = Platform.OS === 'ios' && !NativeModules.DeviceInfo?.isDevice;

// More robust production detection
const isProduction = !isExpoGo && !isDevEnvironment && Constants.appOwnership === 'standalone';

// Additional checks for production environment
const isTestFlight = !isExpoGo && !isDevEnvironment && Platform.OS === 'ios';
const isPlayStore = !isExpoGo && !isDevEnvironment && Platform.OS === 'android';
const shouldUseProductionAds = isProduction || isTestFlight || isPlayStore;

// App ID for AdMob
export const ADMOB_APP_ID = 'ca-app-pub-4299404428269280~3566150382';

// Conditional imports to prevent Expo Go crashes
let InterstitialAd: any = null;
let RewardedAd: any = null;
let BannerAd: any = null;
let TestIds: any = null;
let AdEventType: any = null;
let RewardedAdEventType: any = null;
let BannerAdSize: any = null;

// Only import AdMob components if not in Expo Go
if (!isExpoGo) {
  try {
    const GoogleMobileAds = require('react-native-google-mobile-ads');
    InterstitialAd = GoogleMobileAds.InterstitialAd;
    RewardedAd = GoogleMobileAds.RewardedAd;
    BannerAd = GoogleMobileAds.BannerAd;
    TestIds = GoogleMobileAds.TestIds;
    AdEventType = GoogleMobileAds.AdEventType;
    RewardedAdEventType = GoogleMobileAds.RewardedAdEventType;
    BannerAdSize = GoogleMobileAds.BannerAdSize;
  } catch (error) {
    console.warn('Google Mobile Ads not available:', error);
  }
}

// Log detection results for debugging
console.log(`📱 App environment detection:`); 
console.log(`- Is Expo Go: ${isExpoGo}`);
console.log(`- Is Development: ${isDevEnvironment}`);
console.log(`- Is Simulator: ${isSimulator}`);
console.log(`- Is Production Build: ${isProduction}`);
console.log(`- Is TestFlight: ${isTestFlight}`);
console.log(`- Is Play Store: ${isPlayStore}`);
console.log(`- Should Use Production Ads: ${shouldUseProductionAds}`);
console.log(`- App Ownership: ${Constants.appOwnership}`);
console.log(`- Release Channel: ${Constants.manifest?.releaseChannel || 'default'}`);
console.log(`- Bundle ID: ${Application.applicationId || 'unknown'}`);

// Log the environment for debugging (enhanced)
const environmentType = isExpoGo ? 'Expo Go' : isDevEnvironment ? 'Development' : shouldUseProductionAds ? 'Production' : 'Unknown';
console.log(`📱 Detected environment: ${environmentType}`);
console.log(`📱 Platform: ${Platform.OS}, Release Channel: ${Constants.manifest?.releaseChannel || 'default'}, Bundle ID: ${Application.applicationId || 'unknown'}`);

// Track mock ad state for Expo Go testing
let mockAdLoaded = false;
let mockRewardCallback: (() => void) | null = null;

// Ad state tracking variables
let rewardedAd: any = null;
let isRewardedAdLoaded = false;
let onRewardCallback: (() => void) | null = null;
let adLoadInProgress = false;
let lastAdLoadAttempt = 0;
let adLoadRetryCount = 0;
let adModulesInitialized = false;
let mobileAdsInstance: any = null;

// Ad configuration with correct AdMob console IDs
const AD_UNIT_IDS = {
  ios: {
    rewarded: 'ca-app-pub-4299404428269280/4775290270', // Rewarded ad (from AdMob console)
    banner: 'ca-app-pub-4299404428269280/2212871388'     // Banner ad (from AdMob console)
  },
  android: {
    rewarded: 'ca-app-pub-4299404428269280/4775290270', // Rewarded ad (from AdMob console)
    banner: 'ca-app-pub-4299404428269280/2212871388'     // Banner ad (from AdMob console)
  }
};

// Test devices for better ad testing
const TEST_DEVICES = ['EMULATOR', 'SIMULATOR'];

// Exponential backoff for ad retry attempts
const getBackoffTime = (retryCount: number): number => {
  return Math.min(30000, 1000 * Math.pow(2, retryCount)); // Cap at 30 seconds
};

// Get the correct ad unit ID based on platform and environment
const getAdUnitId = (adType: 'rewarded' | 'banner', platform: 'ios' | 'android' = Platform.OS as 'ios' | 'android') => {
  console.log(`🎯 Getting ad unit ID for: ${adType} on ${platform}, shouldUseProductionAds: ${shouldUseProductionAds}`);
  
  // Use test ad unit IDs for development and Expo Go
  if (isDevEnvironment || isExpoGo || !shouldUseProductionAds) {
    const testId = adType === 'rewarded' ? TestIds?.REWARDED : TestIds?.BANNER;
    console.log(`🧪 Using test ad unit ID: ${testId}`);
    return testId;
  }
  
  // Use production ad unit IDs for all production builds (including TestFlight)
  const prodId = AD_UNIT_IDS[platform][adType];
  console.log(`🏭 Using production ad unit ID: ${prodId}`);
  return prodId;
};

/**
 * Initialize the AdMob SDK and prepare ads
 */
export const initializeAds = async () => {
  // In Expo Go, use mock implementation instead of real ads
  if (isExpoGo) {
    setTimeout(() => {
      mockAdLoaded = true;
    }, 1000);
    return true;
  }
  
  // Real implementation for production/TestFlight builds
  try {
    console.log(`🚀 Initializing AdMob SDK...`);
    
    // Check if already initialized
    if (adModulesInitialized) {
      console.log(`✅ AdMob SDK already initialized`);
      return true;
    }
    
    // Get the MobileAds instance
    const { MobileAds } = require('react-native-google-mobile-ads');
    mobileAdsInstance = MobileAds();
    
    // Initialize the SDK
    console.log(`🔧 Starting AdMob SDK initialization...`);
    await mobileAdsInstance.initialize();
    console.log(`✅ AdMob SDK initialized successfully`);
    
    // Configure request settings based on environment
    const requestConfig: any = {
      maxAdContentRating: 'T',
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false
    };
    
    // Add test devices for development only
    if (isDevEnvironment || !shouldUseProductionAds) {
      const testDevices = [];
      
      // Add appropriate test device IDs based on platform
      if (Platform.OS === 'android') {
        testDevices.push('EMULATOR');
      } else if (Platform.OS === 'ios') {
        testDevices.push('SIMULATOR');
      }
      
      requestConfig.testDeviceIdentifiers = testDevices;
      console.log(`🧪 Using test device configuration for development`);
    } else {
      console.log(`🏭 Using production ad configuration`);
    }
    
    // Apply configuration
    await mobileAdsInstance.setRequestConfiguration(requestConfig);
    
    adModulesInitialized = true;
    
    // Pre-load initial ad for better user experience
    const maxPreloadAttempts = 3;
    for (let i = 0; i < maxPreloadAttempts; i++) {
      try {
        await loadRewardedAd();
        break;
      } catch (error) {
        if (i === maxPreloadAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ AdMob SDK initialization failed:`, error);
    adModulesInitialized = false;
    
    // If initialization fails, try once more after a delay
    try {
      console.log(`🔄 Retrying AdMob SDK initialization in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset state and try again
      mobileAdsInstance = null;
      const result = await initializeAds();
      return result;
    } catch (retryError) {
      console.error(`❌ AdMob SDK retry initialization failed:`, retryError);
      return false;
    }
  }
};



/**
 * Load a rewarded ad
 * Returns a cleanup function to remove event listeners
 */
export const loadRewardedAd = async (): Promise<() => void> => {
  // Handle Expo Go mock implementation or if components not available
  if (isExpoGo || !RewardedAd) {
    setTimeout(() => {
      mockAdLoaded = true;
    }, 1000);
    return () => {};
  }
  
  // Check if an ad is already being loaded
  if (adLoadInProgress) {
    return () => {};
  }
  
  // Throttle requests to prevent spam
  const now = Date.now();
  const timeSinceLastLoad = now - lastAdLoadAttempt;
  const MIN_TIME_BETWEEN_LOADS = 1000; // 1 second between loads
  if (timeSinceLastLoad < MIN_TIME_BETWEEN_LOADS) {
    return () => {};
  }
  
  // Start load process
  adLoadInProgress = true;
  lastAdLoadAttempt = now;
  
  try {
    // Ensure AdMob is initialized
    if (!adModulesInitialized) {
      const initialized = await initializeAds();
      if (!initialized) {
        throw new Error('Failed to initialize AdMob SDK');
      }
    }
    
    // Get ad unit ID based on platform and environment
    const adUnitId = getAdUnitId('rewarded');
    
    // Create new rewarded ad instance
    const adRequestOptions = {
      requestNonPersonalizedAdsOnly: false,
      keywords: ['game', 'arcade', 'puzzle', 'maze', 'tilting']
    };
    
    // For production builds, add additional targeting parameters
    if (shouldUseProductionAds) {
      Object.assign(adRequestOptions, {
        requestAgent: 'TiltMazeGame-Production',
        contentUrl: 'https://tiltmazegame.com',
      });
      console.log(`🎯 Using production ad targeting parameters`);
    }
    
    // Create the ad request with proper options
    rewardedAd = RewardedAd.createForAdRequest(adUnitId, adRequestOptions);
    
    // Track ad events
    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      isRewardedAdLoaded = true;
      adLoadInProgress = false;
      adLoadRetryCount = 0;
    });
    
    const unsubscribeEarned = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      if (onRewardCallback) {
        onRewardCallback();
        onRewardCallback = null;
      }
    });
    
    const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      isRewardedAdLoaded = false;
      rewardedAd = null;
      
      // Preload next ad after a short delay
      setTimeout(() => {
        loadRewardedAd().catch(() => {});
      }, 1000);
    });
    
    const unsubscribeError = rewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
      // Reset states
      isRewardedAdLoaded = false;
      adLoadInProgress = false;
      
      // Implementation of retry with backoff
      adLoadRetryCount++;
      const backoffTime = shouldUseProductionAds ? 
        Math.min(10000, getBackoffTime(adLoadRetryCount)) : 
        getBackoffTime(adLoadRetryCount);
      
      setTimeout(() => {
        loadRewardedAd().catch(() => {});
      }, backoffTime);
    });
    
    // Start loading the ad
    rewardedAd.load();
    
    // Return cleanup function
    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  } catch (error) {
    adLoadInProgress = false;
    
    // Implementation of retry with backoff
    adLoadRetryCount++;
    const backoffTime = shouldUseProductionAds ? 
      Math.min(10000, getBackoffTime(adLoadRetryCount)) : 
      getBackoffTime(adLoadRetryCount);
    
    setTimeout(() => {
      loadRewardedAd().catch(() => {});
    }, backoffTime);
    
    return () => {};
  }
};

export const showRewardedAd = async (onReward: () => void, onClose?: () => void): Promise<boolean> => {
  return new Promise<boolean>(async (resolve) => {
    // Special handling for Expo Go environment or if components not available
    if (isExpoGo || !RewardedAd) {
      mockRewardCallback = onReward;
      
      // Simulate ad viewing with a short delay
      setTimeout(() => {
        Alert.alert(
          'Mock Reward',
          'Since this is a development build, you\'ll automatically receive the reward.',
          [
            {
              text: 'Get Reward',
              onPress: () => {
                if (mockRewardCallback) {
                  mockRewardCallback();
                  mockRewardCallback = null;
                }
                if (onClose) onClose();
                resolve(true);
              }
            }
          ]
        );
      }, 1000);
      return;
    }
    
    // Real ad implementation for production builds
    try {
      console.log(`🎬 Attempting to show rewarded ad in ${shouldUseProductionAds ? 'production' : 'development'} mode`);
      
      // Step 1: Ensure AdMob is initialized
      if (!adModulesInitialized) {
        console.log(`🔧 AdMob not initialized, initializing now...`);
        const success = await initializeAds();
        if (!success) {
          console.error(`❌ Failed to initialize AdMob for rewarded ad`);
          resolve(false);
          return;
        }
      }
      
      // Step 2: Check if we have a preloaded ad ready to show
      if (rewardedAd && isRewardedAdLoaded) {
        console.log(`✅ Using preloaded rewarded ad`);
        onRewardCallback = onReward;
        
        try {
          await rewardedAd.show();
          console.log(`🎬 Preloaded rewarded ad shown successfully`);
          // Will resolve through event handlers
          return;
        } catch (showError) {
          console.error(`❌ Failed to show preloaded rewarded ad:`, showError);
          onRewardCallback = null;
          isRewardedAdLoaded = false;
          rewardedAd = null;
          // Continue to load-then-show approach
        }
      }

      // Step 3: Load and show a new ad on-the-fly
      console.log(`🔄 Loading new rewarded ad on-demand`);
      const adUnitId = getAdUnitId('rewarded');
      console.log(`🎯 Using ad unit ID: ${adUnitId}`);
      
      // Create a dedicated ad instance for this request
      const adRequestOptions = {
        requestNonPersonalizedAdsOnly: false,
        keywords: ['game', 'arcade', 'puzzle', 'maze', 'tilting'],
      };
      
      // Add production targeting if applicable
      if (shouldUseProductionAds) {
        Object.assign(adRequestOptions, {
          requestAgent: 'TiltMazeGame-Production',
          contentUrl: 'https://tiltmazegame.com',
        });
      }
      
      const dedicatedAd = RewardedAd.createForAdRequest(adUnitId, adRequestOptions);
      
      // Set maximum wait time for ad loading
      const MAX_WAIT_TIME = 15000; // 15 seconds
      let loadTimedOut = false;
      
      // Create timeout promise
      const timeoutPromise = new Promise<void>((timeoutResolve) => {
        setTimeout(() => {
          loadTimedOut = true;
          timeoutResolve();
        }, MAX_WAIT_TIME);
      });
      
      // Setup ad loading and showing
      const loadAndShowPromise = new Promise<boolean>((adResolve) => {
        let hasLoaded = false;
        let cleanupCalled = false;
        
        // Event: Ad loaded successfully
        const loadedUnsubscribe = dedicatedAd.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            console.log(`✅ Rewarded ad loaded successfully`);
            hasLoaded = true;
            
            // Update shared state
            rewardedAd = dedicatedAd;
            isRewardedAdLoaded = true;
            
            try {
              onRewardCallback = onReward;
              console.log(`🎬 Attempting to show newly loaded rewarded ad`);
              dedicatedAd.show();
            } catch (showError) {
              console.error(`❌ Failed to show newly loaded rewarded ad:`, showError);
              // Reset state on error
              onRewardCallback = null;
              isRewardedAdLoaded = false;
              rewardedAd = null;
              adResolve(false);
            }
          }
        );
        
        // Event: Ad load/show error
        const errorUnsubscribe = dedicatedAd.addAdEventListener(
          AdEventType.ERROR,
          (error: any) => {
            console.error(`❌ Rewarded ad error:`, error);
            // Only resolve if not already loaded
            if (!hasLoaded) {
              console.log(`💥 Ad failed to load, resolving with false`);
              isRewardedAdLoaded = false;
              rewardedAd = null;
              adResolve(false);
            } else {
              console.log(`💥 Ad error after loading, but ad was already shown`);
            }
          }
        );
        
        // Event: User earned reward
        const rewardUnsubscribe = dedicatedAd.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            console.log(`🎉 User earned reward from rewarded ad!`);
            // Call reward callback if set
            if (onRewardCallback) {
              onRewardCallback();
              onRewardCallback = null;
            }
          }
        );
        
        // Event: Ad closed by user
        const closedUnsubscribe = dedicatedAd.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            // Reset shared state
            isRewardedAdLoaded = false;
            rewardedAd = null;
            
            // Call close callback if provided
            if (onClose) onClose();
            
            // Resolve based on whether ad was loaded
            if (hasLoaded) {
              adResolve(true);
            } else {
              adResolve(false);
            }
            
            // Pre-load next ad after a short delay
            setTimeout(() => loadRewardedAd().catch(() => {}), 1000);
          }
        );
        
        // Start ad loading
        dedicatedAd.load();
        
        // Return cleanup function
        return () => {
          if (cleanupCalled) return;
          cleanupCalled = true;
          
          loadedUnsubscribe();
          errorUnsubscribe();
          rewardUnsubscribe();
          closedUnsubscribe();
        };
      });
      
      // Race between loading ad and timeout
      const result = await Promise.race([
        loadAndShowPromise,
        timeoutPromise.then(() => false)
      ]);
      
      // Handle timeout case
      if (loadTimedOut) {
        // Clean up state
        if (onRewardCallback) {
          onRewardCallback = null;
        }
        isRewardedAdLoaded = false;
        rewardedAd = null;
        
        resolve(false);
        return;
      }
      
      resolve(result as boolean);
    } catch (error) {
      resolve(false);
    }
  });
};

/**
 * Create a banner ad component
 * @param size - Banner size (e.g., 'banner', 'largeBanner', 'fullBanner')
 * @param requestOptions - Additional request options
 * @returns BannerAd component or null
 */
export const createBannerAd = (
  size: any = null,
  requestOptions: any = {}
) => {
  // In Expo Go or if components not available, return null
  if (isExpoGo || !BannerAd) {
    return null;
  }

  const adUnitId = getAdUnitId('banner');
  const bannerSize = size || BannerAdSize?.BANNER;
  
  const defaultRequestOptions = {
    requestNonPersonalizedAdsOnly: false,
    keywords: ['game', 'arcade', 'puzzle', 'maze', 'tilting']
  };

  // For production builds, add additional targeting parameters
  if (shouldUseProductionAds) {
    Object.assign(defaultRequestOptions, {
      requestAgent: 'TiltMazeGame-Production',
      contentUrl: 'https://tiltmazegame.com',
    });
  }

  return BannerAd.createForAdRequest(adUnitId, {
    ...defaultRequestOptions,
    ...requestOptions
  });
};
