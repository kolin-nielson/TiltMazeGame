import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';

// Conditional imports to prevent Expo Go crashes
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

const isExpoGo = Constants.appOwnership === 'expo';

// Only import AdMob components if not in Expo Go
if (!isExpoGo) {
  try {
    const GoogleMobileAds = require('react-native-google-mobile-ads');
    BannerAd = GoogleMobileAds.BannerAd;
    BannerAdSize = GoogleMobileAds.BannerAdSize;
    TestIds = GoogleMobileAds.TestIds;
  } catch (error) {
    console.warn('Google Mobile Ads not available:', error);
  }
}

interface BannerAdComponentProps {
  size?: any; // Can't use BannerAdSize type in Expo Go
  style?: any;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: any) => void;
  unitId?: string;
}

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
  size,
  style,
  onAdLoaded,
  onAdFailedToLoad,
  unitId
}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<any>(null);

  // Don't show ads in Expo Go or if components aren't available
  if (isExpoGo || !BannerAd) {
    return null;
  }

  // Use provided unit ID or get banner ad ID from AdMob console
  const adUnitId = unitId || (
    __DEV__ 
      ? TestIds?.BANNER 
      : 'ca-app-pub-4299404428269280/2212871388'  // Banner ad (from AdMob console)
  );

  const bannerSize = size || BannerAdSize?.BANNER;

  const handleAdLoaded = () => {
    setAdLoaded(true);
    if (onAdLoaded) {
      onAdLoaded();
    }
  };

  const handleAdFailedToLoad = (error: any) => {
    setAdError(error);
    setAdLoaded(false);
    if (onAdFailedToLoad) {
      onAdFailedToLoad(error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adUnitId}
        size={bannerSize}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
          keywords: ['game', 'arcade', 'puzzle', 'maze', 'tilting']
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BannerAdComponent; 