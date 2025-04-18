import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ColorPicker from 'react-native-wheel-color-picker';
import { useAppSelector, useAppDispatch, RootState } from '../store';
import { setTheme, saveTheme, setIsDark } from '../store/slices/themeSlice';
import { ThemeColors, ThemeName } from '../types';
import { useNavigation } from '@react-navigation/native';
import { ThemeScreenNavigationProp } from '../navigation/types';
import { lightTheme, darkTheme } from '../styles/themes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define themes object
const themes: Record<ThemeName, ThemeColors> = {
  light: lightTheme,
  dark: darkTheme,
  system: lightTheme, // Default to light for preview
};

const ThemeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<ThemeScreenNavigationProp>();
  const themeName = useAppSelector((state: RootState) => state.theme.themeName);
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  const isDark = useAppSelector((state: RootState) => state.theme.isDark);

  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(themeName);
  const [editingColor, setEditingColor] = useState<keyof ThemeColors | null>(null);
  const [currentColor, setCurrentColor] = useState<string>('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setSelectedTheme(themeName);
  }, [themeName]);

  const handleSelectTheme = (name: ThemeName) => {
    setSelectedTheme(name);
    dispatch(setTheme(name));
    dispatch(saveTheme(name));

    // Update dark mode state based on selected theme
    if (name === 'dark') {
      dispatch(setIsDark(true));
    } else if (name === 'light') {
      dispatch(setIsDark(false));
    }
    // For 'system', the App.tsx useEffect will handle it based on device setting
  };

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
  };

  const applyColorChange = () => {
    // Custom theme functionality removed in this version
    setEditingColor(null);
  };

  const startEditingColor = (colorKey: keyof ThemeColors) => {
    setEditingColor(colorKey);
    setCurrentColor(colors[colorKey] || '');
  };

  const cancelColorEditing = () => {
    setEditingColor(null);
    setCurrentColor('');
  };

  const renderThemeOption = (name: ThemeName, label: string) => {
    // Skip system theme in the UI options
    if (name === 'system') return null;

    const themeOptionColors = themes[name];

    return (
      <TouchableOpacity
        style={[
          styles.themeOption,
          selectedTheme === name && { borderColor: colors?.primary ?? '#6200ee', borderWidth: 2 },
        ]}
        onPress={() => handleSelectTheme(name)}
      >
        <View style={styles.themePreview}>
          <View style={[styles.previewHeader, { backgroundColor: themeOptionColors.primary }]}>
            <View style={styles.previewButtons}>
              <View style={styles.previewButton} />
              <View style={styles.previewButton} />
              <View style={styles.previewButton} />
            </View>
          </View>
          <View style={[styles.previewBody, { backgroundColor: themeOptionColors.background }]}>
            <View style={[styles.previewItem, { backgroundColor: themeOptionColors.surface }]} />
            <View style={[styles.previewItem, { backgroundColor: themeOptionColors.surface }]} />
            <View style={[styles.previewAccent, { backgroundColor: themeOptionColors.secondary }]} />
          </View>
        </View>
        <Text style={[styles.themeLabel, { color: colors?.onSurface ?? '#000' }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderColorSwatch = (colorKey: keyof ThemeColors, label: string) => {
    const color = colors[colorKey] || '';
    return (
      <TouchableOpacity
        style={[
          styles.colorSwatch,
          { backgroundColor: color },
          editingColor === colorKey && styles.selectedSwatch,
        ]}
        onPress={() => startEditingColor(colorKey)}
      >
        <Text
          style={[
            styles.swatchLabel,
            { color: isLightColor(color) ? (colors?.onSurface ?? '#000') : (colors?.onPrimary ?? '#fff') },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const isLightColor = (color: string): boolean => {
    if (typeof color !== 'string' || !color.startsWith('#') || color.length !== 7) {
      return false;
    }
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors?.background ?? '#fff' }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 16
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors?.primary ?? '#6200ee', marginTop: 16 }]}>Choose Theme</Text>

        <View style={styles.themeOptions}>
          {renderThemeOption('light', 'Light')}
          {renderThemeOption('dark', 'Dark')}
          {renderThemeOption('system', 'System')}
        </View>

        {false && (
          <View style={styles.customizeSection}>
            <Text style={[styles.sectionTitle, { color: colors?.primary ?? '#6200ee' }]}>Customize Colors</Text>

            <View style={styles.colorSwatches}>
              {renderColorSwatch('primary', 'Primary')}
              {renderColorSwatch('secondary', 'Secondary')}
              {renderColorSwatch('background', 'Background')}
              {renderColorSwatch('surface', 'Surface')}
              {renderColorSwatch('onSurface', 'Text')}
              {renderColorSwatch('error', 'Error')}
              {renderColorSwatch('success', 'Success')}
              {renderColorSwatch('walls', 'Walls')}
              {renderColorSwatch('ball', 'Ball')}
              {renderColorSwatch('goal', 'Goal')}
            </View>

            {editingColor && (
              <View style={[
                styles.colorPickerContainer,
                {
                  backgroundColor: colors?.surface ?? '#fff',
                  shadowColor: colors?.onBackground ?? '#000'
                }
              ]}>
                <Text style={[styles.colorTitle, { color: colors?.onSurface ?? '#000' }]}>
                  {editingColor.charAt(0).toUpperCase() + editingColor.slice(1)}:{' '}
                  {currentColor || colors[editingColor] || ''}
                </Text>
                <View
                  style={{
                    height: 300,
                    width: '100%',
                    borderWidth: 1,
                    borderColor: colors?.outline ?? 'rgba(0,0,0,0.1)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    padding: 5,
                  }}
                >
                  <ColorPicker
                    color={currentColor || colors[editingColor] || ''}
                    onColorChange={handleColorChange}
                    thumbSize={40}
                    sliderSize={40}
                    discrete={false}
                    sliderHidden={false}
                    swatches={false}
                    row={false}
                  />
                </View>
                <View style={[styles.colorButtonsContainer, { marginTop: 20 }]}>
                  <TouchableOpacity
                    style={[styles.colorButton, { backgroundColor: colors?.error ?? '#B00020' }]}
                    onPress={cancelColorEditing}
                  >
                    <Text style={[styles.colorButtonText, { color: colors?.onError ?? '#fff' }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.colorButton, { backgroundColor: colors?.primary ?? '#6200ee' }]}
                    onPress={applyColorChange}
                  >
                    <Text style={[styles.colorButtonText, { color: colors?.onPrimary ?? '#fff' }]}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    letterSpacing: 0.15,
    textTransform: 'uppercase',
  },
  themeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  themeOption: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
  },
  themePreview: {
    width: '100%',
    height: 100,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  previewHeader: {
    height: 30,
    padding: 8,
  },
  previewButtons: {
    flexDirection: 'row',
  },
  previewButton: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 4,
  },
  previewBody: {
    flex: 1,
    padding: 8,
  },
  previewItem: {
    height: 10,
    marginBottom: 8,
    borderRadius: 3,
  },
  previewAccent: {
    height: 20,
    borderRadius: 3,
  },
  customizeSection: {
    marginTop: 24,
  },
  colorSwatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorSwatch: {
    width: '30%',
    aspectRatio: 1.5,
    borderRadius: 4,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  selectedSwatch: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    elevation: 5,
  },
  colorPickerContainer: {
    padding: 24,
    marginTop: 24,
    marginBottom: 40,
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    minHeight: 400,
  },
  colorTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.15,
  },
  colorButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  colorButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    width: '48%',
    alignItems: 'center',
    elevation: 1,
  },
  colorButtonText: {
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default ThemeScreen;
