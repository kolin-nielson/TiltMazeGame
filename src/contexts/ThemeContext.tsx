import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, ThemeName } from '../types';

interface ThemeContextType {
  theme: ThemeColors;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  setCustomTheme: (colors: ThemeColors) => void;
}

const lightTheme: ThemeColors = {
  primary: '#6200EE',
  secondary: '#03DAC6',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#000000',
  error: '#B00020',
  success: '#4CAF50',
  walls: '#333333',
  ball: '#FF4081',
  goal: '#4CAF50',
};

const darkTheme: ThemeColors = {
  primary: '#BB86FC',
  secondary: '#03DAC6',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  error: '#CF6679',
  success: '#4CAF50',
  walls: '#BBBBBB',
  ball: '#03DAC6',
  goal: '#BB86FC',
};

const blueTheme: ThemeColors = {
  primary: '#2196F3',
  secondary: '#FFC107',
  background: '#E3F2FD',
  surface: '#FFFFFF',
  text: '#212121',
  error: '#F44336',
  success: '#4CAF50',
  walls: '#1976D2',
  ball: '#F44336',
  goal: '#4CAF50',
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
          setCustomTheme(JSON.parse(savedCustomTheme));
          themes.custom = JSON.parse(savedCustomTheme);
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

  const handleSetCustomTheme = async (colors: ThemeColors) => {
    const updatedCustomTheme = {
      ...lightTheme,
      ...colors,
    };

    setCustomTheme(updatedCustomTheme);
    themes.custom = updatedCustomTheme;

    if (themeName === 'custom') {
      setThemeName('custom');
    }

    try {
      await AsyncStorage.setItem('customTheme', JSON.stringify(updatedCustomTheme));
    } catch (error) {
      console.error('Failed to save custom theme:', error);
    }
  };

  const currentTheme = themeName === 'custom' ? customTheme : themes[themeName];

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
