import { Platform, NativeModules } from 'react-native';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { InterstitialAd, RewardedAd, BannerAd, TestIds, AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';
import * as Application from 'expo-application';

// Environment detection for ad serving
const isExpoGo = Constants.appOwnership === 'expo';
const isDevEnvironment = __DEV__;

// Determine device type (simulator vs real device)
const isSimulator = Platform.OS === 'ios' && !NativeModules.DeviceInfo?.isDevice;

// Simplified production detection - any non-dev, non-Expo Go build is considered production
// This means TestFlight and App Store will both get production ads
const isProduction = !isExpoGo && !isDevEnvironment;

// Log detection results for debugging
console.log(`📱 App environment detection:`); 
console.log(`- Is Expo Go: ${isExpoGo}`); 
console.log(`- Is Development: ${isDevEnvironment}`); 
console.log(`- Is Simulator: ${isSimulator}`); 
console.log(`- Is Production Build: ${isProduction}`); 
console.log(`- Release Channel: ${Constants.manifest?.releaseChannel || 'default'}`); 
console.log(`- Bundle ID: ${Application.applicationId || 'unknown'}`);

// Log the environment for debugging (enhanced)
console.log(`📱 Detected environment: ${isExpoGo ? 'Expo Go' : isDevEnvironment ? 'Development' : 'Production'}`);
console.log(`📱 Platform: ${Platform.OS}, Release Channel: ${Constants.manifest?.releaseChannel || 'default'}, Bundle ID: ${Application.applicationId || 'unknown'}`);

// Track mock ad state for Expo Go testing
let mockAdLoaded = false;
let mockRewardCallback: (() => void) | null = null;

// Ad state tracking variables
let rewardedAd: RewardedAd | null = null;
let isRewardedAdLoaded = false;
let onRewardCallback: (() => void) | null = null;
let adLoadInProgress = false;
let lastAdLoadAttempt = 0;
let adLoadRetryCount = 0;
let adModulesInitialized = false;
let mobileAdsInstance: any = null;

// Ad Unit IDs for production
const AD_UNIT_IDS = {
  REWARDED: {
    ios: 'ca-app-pub-4299404428269280/4775290270',
    android: 'ca-app-pub-4299404428269280/4205278782',
  },
};

// Test devices for better ad testing
const TEST_DEVICES = ['EMULATOR', 'SIMULATOR'];

/**
 * Get the appropriate ad unit ID based on environment and platform
 */
const getAdUnitId = (adType: keyof typeof AD_UNIT_IDS) => {
  const platform = Platform.OS as 'ios' | 'android';
  
  // SIMPLIFIED LOGIC: Use test IDs ONLY in development or Expo Go
  // This ensures TestFlight and App Store builds ALWAYS use production ads
  const shouldUseTestIds = isDevEnvironment || isExpoGo;
  
  if (shouldUseTestIds) {
    console.log('🧪 Using test ad unit ID for development/Expo Go environment');
    console.log(`🔍 Environment decision: isDevEnvironment=${isDevEnvironment}, isExpoGo=${isExpoGo}`);
    return TestIds.REWARDED;
  } else {
    console.log(`💰 Using REAL ad unit ID for ${platform} in production build`);
    return AD_UNIT_IDS[adType][platform];
  }
};
/**
 * Initialize the AdMob SDK and prepare ads
 */
export const initializeAds = async () => {
  // In Expo Go, use mock implementation instead of real ads
  if (isExpoGo) {
    console.log('📱 Running in Expo Go - using mock ads implementation');
    setTimeout(() => {
      mockAdLoaded = true;
      console.log('Mock rewarded ad loaded for Expo Go testing');
    }, 1000);
    return true;
  }
  
  // Real implementation for production/TestFlight builds
  try {
    // Check if already initialized
    if (adModulesInitialized) {
      console.log('📋 AdMob SDK already initialized');
      return true;
    }
    
    console.log(`🚀 Initializing AdMob SDK in ${isDevEnvironment ? 'Development' : 'Production'} mode...`);
    
    // Get the MobileAds instance
    const { MobileAds } = require('react-native-google-mobile-ads');
    mobileAdsInstance = MobileAds();
    
    // Initialize the SDK
    await mobileAdsInstance.initialize();
    
    // Configure test devices for development only
    if (isDevEnvironment) {
      console.log('🧪 Configuring test devices for non-production environment');
      
      const testDevices = [];
      
      // Add appropriate test device IDs based on platform
      if (Platform.OS === 'android') {
        testDevices.push('EMULATOR');
      } else if (Platform.OS === 'ios') {
        testDevices.push('SIMULATOR');
        // Add any physical test device IDs you have registered in AdMob
        // testDevices.push('2077ef9a63d2b398840261c8221a0c9b'); // Example - replace with your actual device IDs
      }
      
      // Apply test device configuration
      await mobileAdsInstance.setRequestConfiguration({
        testDeviceIdentifiers: testDevices,
        maxAdContentRating: 'T' // Setting appropriate content rating
      });
      
      console.log(`🧪 Test devices configured: ${testDevices.join(', ')}`);
    }
    
    console.log('✅ AdMob SDK initialized successfully');
    adModulesInitialized = true;
    
    // Pre-load an ad for better user experience (multiple attempts for production builds)
    let preloadSuccess = false;
    const maxPreloadAttempts = isProduction ? 3 : 1;
    
    for (let i = 0; i < maxPreloadAttempts && !preloadSuccess; i++) {
      try {
        console.log(`🔄 Preloading ad attempt ${i + 1} of ${maxPreloadAttempts}...`);
        await loadRewardedAd();
        console.log('🎁 Initial rewarded ad pre-loaded successfully');
        preloadSuccess = true;
      } catch (preloadError) {
        console.warn(`⚠️ Ad preload attempt ${i + 1} failed:`, preloadError);
        // Short delay between attempts
        if (i < maxPreloadAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    if (!preloadSuccess) {
      console.warn('⚠️ All initial ad preload attempts failed. Will try again later.');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize AdMob SDK:', error);
    
    // Retry initialization after delay
    setTimeout(() => {
      console.log('🔄 Retrying AdMob SDK initialization...');
      initializeAds();
    }, 5000);
    
    return false;
  }
};
/**
 * Calculate backoff time for retries with exponential backoff and jitter
 */
const getBackoffTime = (retryCount: number): number => {
  const baseDelay = 2000; // 2 seconds base delay
  const maxDelay = 60000; // Cap at 1 minute
  // Exponential backoff: 2^retry * baseDelay (capped at maxDelay)
  const exponentialDelay = Math.min(maxDelay, Math.pow(2, retryCount) * baseDelay);
  // Add jitter of ±20% to prevent synchronized retries
  const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
  return Math.floor(exponentialDelay + jitter);
};

/**
 * Load a rewarded ad
 * Returns a cleanup function to remove event listeners
 */
export const loadRewardedAd = async (): Promise<() => void> => {
  // Handle Expo Go mock implementation
  if (isExpoGo) {
    console.log('📱 Loading mock rewarded ad for Expo Go');
    setTimeout(() => {
      mockAdLoaded = true;
      console.log('✅ Mock rewarded ad loaded successfully');
    }, 1000);
    return () => {};
  }
  
  // Enhanced logging for production builds
  if (isProduction) {
    console.log('🛠 Loading rewarded ad in production environment');
  }
  
  // Prevent multiple simultaneous load attempts
  if (adLoadInProgress) {
    console.log('⏳ Skipping ad load - already in progress');
    return () => {};
  }
  
  // Implement request throttling - use a shorter interval for production builds
  const now = Date.now();
  const timeSinceLastAttempt = now - lastAdLoadAttempt;
  // Use shorter interval in production to try more frequently
  const minimumTimeBetweenAttempts = isProduction ? 5000 : 10000; 
  
  if (timeSinceLastAttempt < minimumTimeBetweenAttempts && lastAdLoadAttempt > 0) {
    const waitTime = (minimumTimeBetweenAttempts - timeSinceLastAttempt) / 1000;
    console.log(`⏱️ Throttling ad load requests. Will retry in ${waitTime.toFixed(1)}s`);
    setTimeout(() => loadRewardedAd(), minimumTimeBetweenAttempts - timeSinceLastAttempt);
    return () => {};
  }
  
  // Start load process
  adLoadInProgress = true;
  lastAdLoadAttempt = now;
  
  try {
    // Ensure AdMob is initialized
    if (!adModulesInitialized) {
      console.log('🔄 AdMob SDK not initialized yet, initializing first...');
      const initialized = await initializeAds();
      if (!initialized) {
        throw new Error('Failed to initialize AdMob SDK');
      }
    }
    
    // Get ad unit ID based on platform and environment
    const adUnitId = getAdUnitId('REWARDED');
    console.log(`📋 Loading rewarded ad with ID: ${adUnitId}`);
    
    // Create new rewarded ad instance with additional TestFlight parameters if needed
    const adRequestOptions = {
      requestNonPersonalizedAdsOnly: false,
      keywords: ['game', 'arcade', 'puzzle', 'maze', 'tilting']
    };
    
    // For production builds, add additional targeting parameters
    if (isProduction) {
      // Enhanced targeting for production ads
      console.log('💰 Using enhanced ad configuration for production');
      
      // Add more specific targeting for better ad performance
      Object.assign(adRequestOptions, {
        requestAgent: 'TiltMazeGame-Production',
        // Add additional parameters that might help with test ads
        contentUrl: 'https://example.com/games/tiltmaze',
      });
    }
    
    // Create the ad request with proper options
    rewardedAd = RewardedAd.createForAdRequest(adUnitId, adRequestOptions);
    
    // Track ad events
    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('✅ Rewarded ad loaded successfully');
      isRewardedAdLoaded = true;
      adLoadInProgress = false;
      adLoadRetryCount = 0; // Reset retry count on success
    });
    
    const unsubscribeEarned = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      console.log('🎁 User earned reward');
      if (onRewardCallback) {
        onRewardCallback();
        onRewardCallback = null;
      }
    });
    
    const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('👋 Rewarded ad closed');
      isRewardedAdLoaded = false;
      rewardedAd = null;
      
      // Preload next ad after a short delay
      setTimeout(() => {
        loadRewardedAd().catch(err => {
          console.warn('Failed to preload next ad:', err);
        });
      }, 1000);
    });
    
    const unsubscribeError = rewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
      const errorMsg = error?.message || 'Unknown error';
      const errorCode = error?.code || 'No code';
      console.error(`❌ Rewarded ad error: ${errorMsg} (Code: ${errorCode})`);
      
      // Add helpful debug timeout for production builds to track issues
      if (isProduction) {
        // Check if we're using test ad unit IDs
        const isTestAd = isDevEnvironment || isExpoGo;
        
        console.error('🐞 Production Ad Error Details:', {
          errorMessage: errorMsg,
          errorCode: errorCode,
          adUnitId: adUnitId,
          isTestAd: isTestAd,
          deviceInfo: {
            platform: Platform.OS,
            version: Platform.Version,
            isProduction: isProduction
          }
        });
      }
      
      // Reset states
      isRewardedAdLoaded = false;
      adLoadInProgress = false;
      
      // Implementation of retry with backoff - shorter for production
      adLoadRetryCount++;
      // Use shorter backoff times in production
      const backoffTime = isProduction ? 
        Math.min(5000, getBackoffTime(adLoadRetryCount) / 2) : 
        getBackoffTime(adLoadRetryCount);
        
      console.log(`⏱️ Ad load failed. Retry ${adLoadRetryCount} scheduled in ${backoffTime/1000}s`);
      
      setTimeout(() => {
        loadRewardedAd().catch(err => {
          console.warn('Retry load failed:', err);
        });
      }, backoffTime);
    });
    
    // Start loading the ad
    console.log('🔄 Starting ad load process...');
    rewardedAd.load();
    
    // Return cleanup function
    return () => {
      console.log('🧹 Cleaning up ad event listeners');
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  } catch (error) {
    console.error('❌ Error setting up rewarded ad:', error);
    adLoadInProgress = false;
    
    // Implementation of retry with backoff
    adLoadRetryCount++;
    // Use shorter backoff times in production
    const backoffTime = isProduction ? 
      Math.min(5000, getBackoffTime(adLoadRetryCount) / 2) : 
      getBackoffTime(adLoadRetryCount);
    
    console.log(`⏱️ Ad setup failed. Retry ${adLoadRetryCount} scheduled in ${backoffTime/1000}s`);
    
    setTimeout(() => {
      loadRewardedAd().catch(err => {
        console.warn('Setup retry failed:', err);
      });
    }, backoffTime);
    
    return () => {};
  }
};
export const showRewardedAd = async (callback: () => void): Promise<boolean> => {
  return new Promise<boolean>(async (resolve) => {
    // Special handling for Expo Go environment
    if (isExpoGo) {
      console.log('🎟️ Show mock rewarded ad in Expo Go');
      mockRewardCallback = callback;
      
      // Simulate ad viewing with a short delay
      setTimeout(() => {
        console.log('✅ Mock ad viewed completely');
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
      // Step 1: Ensure AdMob is initialized
      if (!adModulesInitialized) {
        console.log('🔄 AdMob SDK not initialized, initializing now...');
        const success = await initializeAds();
        if (!success) {
          console.error('❌ Failed to initialize AdMob SDK');
          resolve(false);
          return;
        }
      }
      
      // Step 2: Check if we have a preloaded ad ready to show
      if (rewardedAd && isRewardedAdLoaded) {
        console.log('✅ Preloaded rewarded ad available, showing immediately');
        onRewardCallback = callback;
        
        try {
          await rewardedAd.show();
          // Will resolve through event handlers
          return;
        } catch (showError) {
          console.error('❌ Error showing preloaded ad:', showError);
          onRewardCallback = null;
          isRewardedAdLoaded = false;
          rewardedAd = null;
          // Continue to load-then-show approach
        }
      } else {
        console.log('⚠️ No preloaded ad available, attempting just-in-time loading');
      }

      // Step 3: Load and show a new ad on-the-fly
      console.log('🔄 Starting load-then-show sequence...');
      
      // Get appropriate ad unit ID
      const adUnitId = getAdUnitId('REWARDED');
      console.log(`📋 Using ad unit ID: ${adUnitId}`);
      
      // Create a dedicated ad instance for this request
      const dedicatedAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
        keywords: ['game', 'arcade', 'puzzle', 'maze', 'tilting'],
      });
      
      // Set maximum wait time for ad loading
      const MAX_WAIT_TIME = 15000; // 15 seconds
      let loadTimedOut = false;
      
      // Create timeout promise
      const timeoutPromise = new Promise<void>((timeoutResolve) => {
        setTimeout(() => {
          console.log(`⏰ Ad load timed out after ${MAX_WAIT_TIME/1000} seconds`);
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
            console.log('✅ Ad loaded successfully');
            hasLoaded = true;
            
            // Update shared state
            rewardedAd = dedicatedAd;
            isRewardedAdLoaded = true;
            
            try {
              // Show ad immediately after loading
              console.log('👁️ Showing ad immediately after load');
              onRewardCallback = callback;
              dedicatedAd.show();
            } catch (showError) {
              console.error('❌ Error showing ad after load:', showError);
              
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
            const errorMsg = error?.message || 'Unknown error';
            const errorCode = error?.code || 'No code';
            console.error(`❌ Ad load/show error: ${errorMsg} (Code: ${errorCode})`);
            
            // Only resolve if not already loaded
            if (!hasLoaded) {
              isRewardedAdLoaded = false;
              rewardedAd = null;
              adResolve(false);
            }
          }
        );
        
        // Event: User earned reward
        const rewardUnsubscribe = dedicatedAd.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            console.log('🎁 User earned reward!');
            
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
            console.log('👋 Ad closed by user');
            
            // Reset shared state
            isRewardedAdLoaded = false;
            rewardedAd = null;
            
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
        console.log('🔄 Initiating ad load...');
        dedicatedAd.load();
        
        // Return cleanup function
        return () => {
          if (cleanupCalled) return;
          cleanupCalled = true;
          
          loadedUnsubscribe();
          errorUnsubscribe();
          rewardUnsubscribe();
          closedUnsubscribe();
          console.log('🧹 Ad event listeners cleaned up');
        };
      });
      
      // Race between loading ad and timeout
      const result = await Promise.race([
        loadAndShowPromise,
        timeoutPromise.then(() => false)
      ]);
      
      // Handle timeout case
      if (loadTimedOut) {
        console.log('⏰ Ad load-and-show process timed out');
        
        // Clean up state
        if (onRewardCallback) {
          onRewardCallback = null;
        }
        isRewardedAdLoaded = false;
        rewardedAd = null;
        
        // Resolve as false and try to preload for next time
        resolve(false);
        setTimeout(() => loadRewardedAd().catch(() => {}), 1000);
      } else {
        // Resolve with the result from the ad loading process
        resolve(result === true);
      }
    } catch (error) {
      console.error('❌ Critical error in showRewardedAd:', error);
      
      // Reset all state
      if (onRewardCallback) {
        onRewardCallback = null;
      }
      isRewardedAdLoaded = false;
      rewardedAd = null;
      
      // Resolve as false and schedule a preload for next time
      resolve(false);
      setTimeout(() => loadRewardedAd().catch(() => {}), 5000);
    }
  });
};
