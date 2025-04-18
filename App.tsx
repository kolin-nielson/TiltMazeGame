import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { Provider as ReduxProvider } from 'react-redux';
import { store, useAppSelector, useAppDispatch } from './src/store';
import { loadSettings } from './src/store/slices/settingsSlice';
import { loadTheme, setIsDark } from './src/store/slices/themeSlice';
import AppNavigator from './src/navigation/AppNavigator';
import GameLogo from './src/components/GameLogo';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus, useColorScheme } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';
import { lightTheme, darkTheme } from './src/styles/themes';

// Adapt navigation theme to work with react-native-paper
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

// Wrapper component to handle theme and app state
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const themeName = useAppSelector(state => state.theme.themeName);
  const isDark = useAppSelector(state => state.theme.isDark);
  const colors = useAppSelector(state => state.theme.colors);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings and theme on startup
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        dispatch(loadSettings()),
        dispatch(loadTheme()),
      ]);
      setIsLoading(false);
    };

    loadInitialData();
  }, [dispatch]);

  // Handle system theme changes
  useEffect(() => {
    if (themeName === 'system') {
      dispatch(setIsDark(colorScheme === 'dark'));
    } else {
      dispatch(setIsDark(themeName === 'dark'));
    }
  }, [themeName, colorScheme, dispatch]);

  // Handle app state changes (background, active, etc.)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  // Create combined theme for Paper and Navigation
  const combinedTheme = {
    ...isDark ? DarkTheme : LightTheme,
    colors: colors,
  };

  const paperTheme = {
    ...isDark ? MD3DarkTheme : MD3LightTheme,
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
