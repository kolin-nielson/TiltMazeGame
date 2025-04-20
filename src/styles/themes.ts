import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { ThemeColors } from '@types';

export const lightTheme: ThemeColors = {
  ...MD3LightTheme.colors,
  primary: '#6200EE',
  primaryContainer: '#E9DDFF',
  onPrimaryContainer: '#21005E',
  secondary: '#03DAC6',
  secondaryContainer: '#CEFAF3',
  onSecondaryContainer: '#002019',
  tertiary: '#B15DFF',
  tertiaryContainer: '#F2DAFF',
  onTertiaryContainer: '#35004E',
  error: '#B00020',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  background: '#F6F6F6',
  surface: '#FFFFFF',
  surfaceVariant: '#E7E0EB',
  onSurfaceVariant: '#49454E',
  outline: '#79747E',
  outlineVariant: '#CAC4CF',
  inverseSurface: '#313033',
  inverseOnSurface: '#F4EFF4',
  inversePrimary: '#D0BCFF',
  shadow: '#000000',
  scrim: '#000000',
  surfaceDisabled: '#C4C7C5',
  onSurfaceDisabled: '#484848',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  // Maze element colors
  walls: MD3LightTheme.colors.onSurfaceVariant,
  ball: MD3LightTheme.colors.primary,
  laser: MD3LightTheme.colors.error,
  goal: MD3LightTheme.colors.secondary,
};

export const darkTheme: ThemeColors = {
  ...MD3DarkTheme.colors,
  primary: '#BB86FC',
  primaryContainer: '#4F2196',
  onPrimaryContainer: '#EADDFF',
  secondary: '#03DAC6',
  secondaryContainer: '#00504C',
  onSecondaryContainer: '#CEFAF3',
  tertiary: '#D183FF',
  tertiaryContainer: '#6A2B9F',
  onTertiaryContainer: '#F9DEFF',
  error: '#CF6679',
  errorContainer: '#8C0009',
  onErrorContainer: '#FFDAD6',
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#49454E',
  onSurfaceVariant: '#CAC4CF',
  outline: '#938F99',
  outlineVariant: '#49454E',
  inverseSurface: '#F4EFF4',
  inverseOnSurface: '#313033',
  inversePrimary: '#6200EE',
  shadow: '#000000',
  scrim: '#000000',
  surfaceDisabled: '#232323',
  onSurfaceDisabled: '#AAAAAA',
  backdrop: 'rgba(0, 0, 0, 0.8)',
  // Maze element colors
  walls: MD3DarkTheme.colors.onSurfaceVariant,
  ball: MD3DarkTheme.colors.primary,
  laser: MD3DarkTheme.colors.error,
  goal: MD3DarkTheme.colors.secondary,
};

export const lightPaperTheme = {
  ...MD3LightTheme,
  colors: lightTheme,
};

export const darkPaperTheme = {
  ...MD3DarkTheme,
  colors: darkTheme,
};
