import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { ThemeColors } from '@types';

export const lightTheme: ThemeColors = {
  ...MD3LightTheme.colors,
  // MD3 Primary - Vibrant Purple (main brand color)
  primary: '#8B5CF6',
  primaryContainer: '#F3E8FF',
  onPrimaryContainer: '#4C1D95',
  
  // MD3 Secondary - Vibrant Teal/Cyan (accent color)
  secondary: '#06B6D4',
  secondaryContainer: '#CFFAFE',
  onSecondaryContainer: '#0E7490',
  
  // MD3 Tertiary - Vibrant Gold/Yellow (for coins)
  tertiary: '#F59E0B',
  tertiaryContainer: '#FEF3C7',
  onTertiaryContainer: '#92400E',
  
  // MD3 Error - Vibrant Red
  error: '#EF4444',
  errorContainer: '#FEE2E2',
  onErrorContainer: '#991B1B',
  
  // MD3 Neutral surfaces - Brighter
  background: '#FEFEFE',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  onSurfaceVariant: '#475569',
  
  // MD3 Outline and dividers
  outline: '#64748B',
  outlineVariant: '#CBD5E1',
  
  // MD3 Inverse colors
  inverseSurface: '#1E293B',
  inverseOnSurface: '#F8FAFC',
  inversePrimary: '#C4B5FD',
  
  // MD3 Utility colors
  shadow: '#000000',
  scrim: '#000000',
  surfaceDisabled: '#E2E8F0',
  onSurfaceDisabled: '#94A3B8',
  backdrop: 'rgba(0, 0, 0, 0.4)',
  
  // Game-specific colors - Much more vibrant!
  walls: '#475569',         // Darker slate for contrast
  ball: '#EF4444',         // Vibrant red for ball
  laser: '#EF4444',        // Vibrant red for laser
  goal: '#10B981',         // Vibrant green for goal
};

export const darkTheme: ThemeColors = {
  ...MD3DarkTheme.colors,
  // MD3 Primary - Vibrant Purple (main brand color)
  primary: '#A78BFA',
  primaryContainer: '#6D28D9',
  onPrimaryContainer: '#F3E8FF',
  
  // MD3 Secondary - Vibrant Teal/Cyan (accent color)
  secondary: '#22D3EE',
  secondaryContainer: '#0E7490',
  onSecondaryContainer: '#CFFAFE',
  
  // MD3 Tertiary - Vibrant Gold/Yellow (for coins)
  tertiary: '#FBBF24',
  tertiaryContainer: '#92400E',
  onTertiaryContainer: '#FEF3C7',
  
  // MD3 Error - Vibrant Red
  error: '#F87171',
  errorContainer: '#991B1B',
  onErrorContainer: '#FEE2E2',
  
  // MD3 Neutral surfaces - Rich dark
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  onSurfaceVariant: '#CBD5E1',
  
  // MD3 Outline and dividers
  outline: '#64748B',
  outlineVariant: '#475569',
  
  // MD3 Inverse colors
  inverseSurface: '#F1F5F9',
  inverseOnSurface: '#1E293B',
  inversePrimary: '#8B5CF6',
  
  // MD3 Utility colors
  shadow: '#000000',
  scrim: '#000000',
  surfaceDisabled: '#334155',
  onSurfaceDisabled: '#64748B',
  backdrop: 'rgba(0, 0, 0, 0.6)',
  
  // Game-specific colors - Much more vibrant!
  walls: '#CBD5E1',        // Light slate for visibility
  ball: '#F87171',         // Vibrant red for ball
  laser: '#F87171',        // Vibrant red for laser
  goal: '#34D399',         // Vibrant green for goal
};

export const lightPaperTheme = {
  ...MD3LightTheme,
  colors: lightTheme,
};

export const darkPaperTheme = {
  ...MD3DarkTheme,
  colors: darkTheme,
};
