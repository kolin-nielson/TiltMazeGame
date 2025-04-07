import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, ThemeName } from '../types';
// Import Paper theme types and default themes
import { 
    MD3LightTheme, 
    MD3DarkTheme, 
    MD3Theme, // Or use Theme for older versions
    adaptNavigationTheme 
} from 'react-native-paper'; 

interface ThemeContextType {
  theme: MD3Theme;
  themeName: ThemeName;
  isDark: boolean;
  setTheme: (name: ThemeName) => void;
  setCustomTheme: (colors: Partial<ThemeColors>) => void;
  colors: ThemeColors;
}

const lightTheme: ThemeColors = {
  primary: '#6200EE',            // Material purple 500
  onPrimary: '#FFFFFF',          // White text on primary
  primaryContainer: '#E9DDFF',   // Light purple for containers
  onPrimaryContainer: '#21005E', // Dark text on light containers
  secondary: '#03DAC6',          // Material teal A700
  onSecondary: '#000000',        // Black text on secondary
  secondaryContainer: '#CEFAF3', // Light teal for containers
  onSecondaryContainer: '#002019',// Dark text on secondary containers
  tertiary: '#9C4146',           // Tertiary accent color
  onTertiary: '#FFFFFF',         // White text on tertiary
  background: '#F5F5F5',         // Material grey 100
  onBackground: '#000000DE',     // Black text with 87% opacity
  surface: '#FFFFFF',            // White surface
  onSurface: '#000000DE',        // Black text with 87% opacity
  surfaceVariant: '#E7E0EB',     // Light variant surface
  onSurfaceVariant: '#49454E',   // Dark text on surface variant
  outline: '#79747E',            // Outline color
  error: '#B00020',              // Material error color
  onError: '#FFFFFF',            // White text on error
  success: '#4CAF50',            // Material green 500
  walls: '#333333',              // Dark grey for walls
  ball: '#FF4081',               // Material pink A200
  goal: '#4CAF50',               // Material green 500
};

const darkTheme: ThemeColors = {
  primary: '#BB86FC',
  onPrimary: '#FFFFFF',
  primaryContainer: '#4F378A',
  onPrimaryContainer: '#EADDFF',
  secondary: '#03DAC6',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#00413B',
  onSecondaryContainer: '#70F7EE',
  tertiary: '#F2B8BB',
  onTertiary: '#FFFFFF',
  background: '#121212',
  onBackground: '#FFFFFFDE',
  surface: '#1E1E1E',
  onSurface: '#FFFFFFDE',
  surfaceVariant: '#49454E',
  onSurfaceVariant: '#CAC4CF',
  outline: '#948F99',
  error: '#CF6679',
  onError: '#FFFFFF',
  success: '#4CAF50',
  walls: '#BBBBBB',
  ball: '#03DAC6',
  goal: '#BB86FC',
};

const blueTheme: ThemeColors = {
  primary: '#2196F3',            // Material blue 500
  onPrimary: '#FFFFFF',          // White text on primary
  primaryContainer: '#CCE5FF',   // Light blue container
  onPrimaryContainer: '#00397E', // Dark text on light containers
  secondary: '#FFC107',          // Material amber 500
  onSecondary: '#000000',        // Black text on secondary
  secondaryContainer: '#FFECB3', // Light amber container
  onSecondaryContainer: '#553500',// Dark text on light container
  tertiary: '#039BE5',           // Light blue accent
  onTertiary: '#FFFFFF',         // White text on tertiary
  background: '#E3F2FD',         // Material blue 50
  onBackground: '#212121DE',     // Dark grey with 87% opacity
  surface: '#FFFFFF',            // White surface
  onSurface: '#212121DE',        // Dark grey with 87% opacity
  surfaceVariant: '#DFE4EB',     // Light blue variant surface
  onSurfaceVariant: '#41474D',   // Dark text on surface variant
  outline: '#72777F',            // Outline color for blue theme
  error: '#F44336',              // Material red 500
  onError: '#FFFFFF',            // White text on error
  success: '#4CAF50',            // Material green 500
  walls: '#1976D2',              // Material blue 700
  ball: '#F44336',               // Material red 500
  goal: '#4CAF50',               // Material green 500
};

export const themes: Record<ThemeName, ThemeColors> = {
  light: lightTheme,
  dark: darkTheme,
  blue: blueTheme,
  custom: lightTheme, // Default custom theme base
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeName, setThemeName] = useState<ThemeName>('light');
  const [customThemeColors, setCustomThemeColors] = useState<ThemeColors>(lightTheme);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedThemeName = await AsyncStorage.getItem('themeName');
        const savedCustomTheme = await AsyncStorage.getItem('customTheme');

        let initialThemeName: ThemeName = systemColorScheme === 'dark' ? 'dark' : 'light';
        if (savedThemeName) {
          initialThemeName = savedThemeName as ThemeName;
        }
        setThemeName(initialThemeName);

        if (savedCustomTheme) {
          const loadedCustomTheme = JSON.parse(savedCustomTheme);
          // Ensure loaded custom theme has all required fields from ThemeColors
          // You might want to merge with a default base here
          setCustomThemeColors({...lightTheme, ...loadedCustomTheme}); 
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
        // Fallback to system scheme on error
        setThemeName(systemColorScheme === 'dark' ? 'dark' : 'light');
      }
    };

    loadTheme();
  }, [systemColorScheme]);

  const handleSetTheme = async (name: ThemeName) => {
    setThemeName(name);
    try {
      await AsyncStorage.setItem('themeName', name);
    } catch (error) {
      console.error('Failed to save theme name:', error);
    }
  };

  const handleSetCustomTheme = async (colors: Partial<ThemeColors>) => {
    const updatedCustomThemeColors = {
      ...customThemeColors, // Ensure merging with existing custom colors
      ...colors,
    };

    setCustomThemeColors(updatedCustomThemeColors);
    // Always save the full custom theme colors object
    try {
        await AsyncStorage.setItem('customTheme', JSON.stringify(updatedCustomThemeColors));
        // If the current theme wasn't custom, switch to it
        if (themeName !== 'custom') {
           await handleSetTheme('custom');
        }
    } catch (error) {
        console.error('Failed to save custom theme:', error);
    }
  };

  const isDark = themeName === 'dark';
  const basePaperTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  const currentColors: ThemeColors = themeName === 'custom' 
     ? customThemeColors 
     : (themes[themeName] || lightTheme);

  // Construct the final theme object for PaperProvider and context
  const finalTheme: MD3Theme = {
    ...basePaperTheme, // Start with base Paper theme (fonts, roundness, etc.)
    colors: {        // Override colors with your theme's colors
      ...basePaperTheme.colors,
      ...currentColors, // Your specific theme colors take precedence
    },
  };

  // Ensure the colors object provided in the context value matches ThemeColors type
  const contextColors: ThemeColors = {
      ...basePaperTheme.colors,
      ...currentColors,
      success: currentColors.success,
      walls: currentColors.walls,
      ball: currentColors.ball,
      goal: currentColors.goal,
  };

  // *** Add Log Here ***
  console.log('--- ThemeContext Providing ---');
  console.log('isDark:', finalTheme.dark);
  console.log('Theme Name:', themeName);
  console.log('Provided Colors (onSurface):', contextColors.onSurface);
  console.log('Provided Colors (onBackground):', contextColors.onBackground);
  // console.log('Full Context Value:', JSON.stringify({ themeName, isDark: finalTheme.dark, colors: contextColors }, null, 2));

  return (
    <ThemeContext.Provider
      value={{
        theme: finalTheme, 
        themeName,
        isDark: finalTheme.dark,
        setTheme: handleSetTheme,
        setCustomTheme: handleSetCustomTheme,
        colors: contextColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Update useTheme hook return type and provide convenient accessors
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  // Return the full context value, which now includes the Paper theme, colors, isDark etc.
  return context; 
};
