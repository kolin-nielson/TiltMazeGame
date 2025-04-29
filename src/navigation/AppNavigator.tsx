import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useAppSelector, RootState } from '@store';
import { RootStackParamList } from './types';
import { View, ActivityIndicator } from 'react-native';
import HomeScreen from '@screens/HomeScreen';
import TutorialScreen from '@screens/TutorialScreen';
import GameScreen from '@screens/GameScreen';
import SettingsScreen from '@screens/SettingsScreen';
import ThemeScreen from '@screens/ThemeScreen';
import ShopScreen from '@screens/ShopScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const ScreenLoader: React.FC = () => {
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

const AppNavigator: React.FC = () => {
  const isDark = useAppSelector((state: RootState) => state.theme.isDark);
  const colors = useAppSelector((state: RootState) => state.theme.colors);

  return (
    <>
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
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Tutorial"
          component={TutorialScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{
            title: 'The Tilt Maze',
            gestureEnabled: false,
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
          }}
        />
        <Stack.Screen
          name="Theme"
          component={ThemeScreen}
          options={{
            title: 'Theme Settings',
          }}
        />
        <Stack.Screen
          name="Shop"
          component={ShopScreen}
          options={{
            title: 'Shop',
          }}
        />
      </Stack.Navigator>
    </>
  );
};

export default AppNavigator;
