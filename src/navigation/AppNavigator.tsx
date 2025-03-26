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

  return (
    <NavigationContainer>
      <StatusBar style={theme.background === '#121212' ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Tilt Maze' }} />
        <Stack.Screen
          name="LevelSelect"
          component={LevelSelectScreen}
          options={{ title: 'Select Level' }}
        />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{ title: 'Playing', headerBackVisible: false }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="Theme" component={ThemeScreen} options={{ title: 'Theme Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
