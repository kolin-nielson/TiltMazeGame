import React, { Suspense } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useAppSelector, RootState } from '@store';
import { RootStackParamList } from './types';
import { View, ActivityIndicator } from 'react-native';

const HomeScreen = React.lazy(() => import('@screens/HomeScreen'));
const TutorialScreen = React.lazy(() => import('@screens/TutorialScreen'));
const GameScreen = React.lazy(() => import('@screens/GameScreen'));
const SettingsScreen = React.lazy(() => import('@screens/SettingsScreen'));
const ThemeScreen = React.lazy(() => import('@screens/ThemeScreen'));
const ShopScreen = React.lazy(() => import('@screens/ShopScreen'));

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
      <Suspense fallback={<ScreenLoader />}>
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
              title: 'Mazer Beam',
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
      </Suspense>
    </>
  );
};

export default AppNavigator;
