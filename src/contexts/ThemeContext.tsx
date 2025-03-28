import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, ThemeName } from '../types';

interface ThemeContextType {
  theme: ThemeColors;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  setCustomTheme: (colors: Partial<ThemeColors>) => void;
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
  primary: '#BB86FC',            // Material purple A200
  onPrimary: '#000000',          // Black text on primary
  primaryContainer: '#4F378A',   // Medium purple container
  onPrimaryContainer: '#EADDFF', // Light text on dark containers
  secondary: '#03DAC6',          // Material teal A700
  onSecondary: '#000000',        // Black text on secondary
  secondaryContainer: '#00413B', // Dark teal container
  onSecondaryContainer: '#70F7EE',// Light text on dark container
  tertiary: '#F2B8BB',          // Light tertiary for dark theme
  onTertiary: '#5E1114',         // Dark text on light tertiary
  background: '#121212',         // Material dark background
  onBackground: '#FFFFFFDE',     // White text with 87% opacity
  surface: '#1E1E1E',            // Material dark surface
  onSurface: '#FFFFFFDE',        // White text with 87% opacity
  surfaceVariant: '#49454E',     // Dark variant surface
  onSurfaceVariant: '#CAC4CF',   // Light text on dark surface variant
  outline: '#948F99',            // Light outline for dark theme
  error: '#CF6679',              // Material error color for dark theme
  onError: '#000000',            // Black text on error
  success: '#4CAF50',            // Material green 500
  walls: '#BBBBBB',              // Light grey for walls
  ball: '#03DAC6',               // Material teal A700
  goal: '#BB86FC',               // Material purple A200
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
  custom: lightTheme,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [themeName, setThemeName] = useState<ThemeName>('light');
  const [customTheme, setCustomTheme] = useState<ThemeColors>(lightTheme);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedThemeName = await AsyncStorage.getItem('themeName');
        const savedCustomTheme = await AsyncStorage.getItem('customTheme');

        if (savedThemeName) {
          setThemeName(savedThemeName as ThemeName);
        } else if (colorScheme) {
          setThemeName(colorScheme === 'dark' ? 'dark' : 'light');
        }

        if (savedCustomTheme) {
          const loadedCustomTheme = JSON.parse(savedCustomTheme);
          setCustomTheme(loadedCustomTheme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };

    loadTheme();
  }, [colorScheme]);

  const handleSetTheme = async (name: ThemeName) => {
    setThemeName(name);
    try {
      await AsyncStorage.setItem('themeName', name);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const handleSetCustomTheme = async (colors: Partial<ThemeColors>) => {
    const updatedCustomTheme = {
      ...customTheme,
      ...colors,
    };

    setCustomTheme(updatedCustomTheme);

    if (themeName !== 'custom') {
      handleSetTheme('custom');
    } else {
      try {
        await AsyncStorage.setItem('customTheme', JSON.stringify(updatedCustomTheme));
      } catch (error) {
        console.error('Failed to save custom theme:', error);
      }
    }
  };

  const currentTheme = themeName === 'custom' ? customTheme : (themes[themeName] || lightTheme);

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        themeName,
        setTheme: handleSetTheme,
        setCustomTheme: handleSetCustomTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
