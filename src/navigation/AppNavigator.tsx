import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';
import { ActivityIndicator, View } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import GameScreen from '../screens/GameScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ThemeScreen from '../screens/ThemeScreen';

export type RootStackParamList = {
  Home: undefined;
  Game: { mazeId?: string };
  Settings: undefined;
  Theme: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const { LightTheme: AdaptedLightTheme, DarkTheme: AdaptedDarkTheme } = adaptNavigationTheme({
  reactNavigationLight: MD3LightTheme, 
  reactNavigationDark: MD3DarkTheme,
});

const AppNavigator: React.FC = () => {
  const { isDark, colors, theme } = useTheme();
  
  if (!colors || !theme) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const navigationTheme = isDark ? AdaptedDarkTheme : AdaptedLightTheme;

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors?.primary ?? '#6200ee',
          },
          headerTintColor: colors?.onPrimary ?? '#ffffff',
          headerTitleStyle: {
            fontWeight: '500',
            fontSize: 20,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors?.background ?? '#ffffff',
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ 
          headerShown: false, 
        }} />
        
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{
            title: 'Endless Maze',
            gestureEnabled: false,
            headerBackVisible: false,
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Settings' }}
        />
        <Stack.Screen 
          name="Theme" 
          component={ThemeScreen} 
          options={{ title: 'Theme Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
