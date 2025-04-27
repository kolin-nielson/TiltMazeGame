import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Tutorial: undefined;
  Game: undefined;
  Settings: undefined;
  Theme: undefined;
  Shop: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
export type GameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;
export type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;
export type ThemeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Theme'>;
export type ShopScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Shop'>;
export type TutorialScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tutorial'>;
