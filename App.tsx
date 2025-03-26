import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { MazeProvider } from './src/contexts/MazeContext';
import GameLogo from './src/components/GameLogo';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const SplashScreen = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.splashContainer, { backgroundColor: theme.background }]}>
      <GameLogo size={200} showText={true} />
      <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
    </View>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PaperProvider>
            <SettingsProvider>
              <MazeProvider>
                <AppNavigator />
              </MazeProvider>
            </SettingsProvider>
          </PaperProvider>
        </ThemeProvider>
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
