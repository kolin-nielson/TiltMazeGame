import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Provider as PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
} from 'react-native-paper';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { Provider as ReduxProvider } from 'react-redux';
import { store, useAppSelector, useAppDispatch } from '@store';
import { loadSettings } from '@store/slices/settingsSlice';
import { loadTheme, setIsDark } from '@store/slices/themeSlice';
import { loadShopData } from '@store/slices/shopSlice';
import AppNavigator from '@navigation/AppNavigator';
import GameLogo from '@components/logo/GameLogo';
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { initializeAds, loadRewardedAd } from './src/services/adsService';
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
  materialLight: MD3LightTheme,
  materialDark: MD3DarkTheme,
});
const SplashScreen = () => {
  const colors = useAppSelector(state => state.theme.colors);
  return (
    <View style={[styles.splashContainer, { backgroundColor: colors.background }]}>
      <GameLogo size={200} showText={true} />
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
    </View>
  );
};
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const themeName = useAppSelector(state => state.theme.themeName);
  const isDark = useAppSelector(state => state.theme.isDark);
  const colors = useAppSelector(state => state.theme.colors);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          dispatch(loadSettings()),
          dispatch(loadTheme()),
          dispatch(loadShopData())
        ]);
        try {
          await initializeAds();
          await loadRewardedAd();
        } catch (adError) {
          console.warn('Ad initialization error:', adError);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [dispatch]);
  useEffect(() => {
    if (themeName === 'system') {
      dispatch(setIsDark(colorScheme === 'dark'));
    } else {
      dispatch(setIsDark(themeName === 'dark'));
    }
  }, [themeName, colorScheme, dispatch]);
  if (isLoading) {
    return <SplashScreen />;
  }
  const combinedTheme = {
    ...(isDark ? DarkTheme : LightTheme),
    colors: colors,
  };
  const paperTheme = {
    ...(isDark ? MD3DarkTheme : MD3LightTheme),
    colors: colors,
  };
  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={combinedTheme}>
        <ErrorBoundary>
          <AppNavigator />
        </ErrorBoundary>
      </NavigationContainer>
    </PaperProvider>
  );
};
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <AppContent />
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
