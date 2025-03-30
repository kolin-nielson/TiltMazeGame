import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import LevelSelectScreen from '../screens/LevelSelectScreen';
import GameScreen from '../screens/GameScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ThemeScreen from '../screens/ThemeScreen';

export type RootStackParamList = {
  Home: undefined;
  LevelSelect: undefined;
  Game: { mazeId: string };
  Settings: undefined;
  Theme: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { theme } = useTheme();
  
  // Determine if the current theme is dark based on background color
  const isDarkTheme = theme.background === '#121212' || 
                      theme.background.toLowerCase() === '#000000' || 
                      theme.background.toLowerCase() === '#000';

  return (
    <NavigationContainer>
      <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTintColor: theme.onPrimary,
          headerTitleStyle: {
            fontWeight: '500',
            fontSize: 20,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: theme.background,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ 
          title: 'Tilt Maze',
          headerShown: false, 
        }} />
        <Stack.Screen
          name="LevelSelect"
          component={LevelSelectScreen}
          options={{ 
            title: 'Select Level',
            headerBackTitle: 'Home',
          }}
        />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{ 
            title: 'Playing',
            headerBackVisible: false,
            animation: 'fade_from_bottom',
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ 
            title: 'Settings',
            headerBackTitle: 'Home',
          }} 
        />
        <Stack.Screen 
          name="Theme" 
          component={ThemeScreen} 
          options={{ 
            title: 'Theme Settings',
            headerBackTitle: 'Settings',
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
