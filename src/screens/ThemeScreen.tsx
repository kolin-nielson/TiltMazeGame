import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ColorPicker from 'react-native-wheel-color-picker';
import { useTheme, themes } from '../contexts/ThemeContext';
import { ThemeColors, ThemeName } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type ThemeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Theme'>;

interface ThemeScreenProps {
  navigation: ThemeScreenNavigationProp;
}

const ThemeScreen: React.FC<ThemeScreenProps> = ({ navigation }) => {
  const { theme, themeName, setTheme, setCustomTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(themeName);
  const [customColors, setCustomColors] = useState<ThemeColors>({ ...themes.custom });
  const [editingColor, setEditingColor] = useState<keyof ThemeColors | null>(null);
  const [currentColor, setCurrentColor] = useState<string>('');

  useEffect(() => {
    setSelectedTheme(themeName);
    if (themeName === 'custom') {
      setCustomColors({ ...theme });
    }
  }, []);

  useEffect(() => {
    setTheme(selectedTheme);
  }, [selectedTheme]);

  const handleSelectTheme = (name: ThemeName) => {
    setSelectedTheme(name);

    if (name === 'custom' && Object.keys(customColors).length === 0) {
      setCustomColors({ ...themes.custom });
    }
  };

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
  };

  const applyColorChange = () => {
    if (editingColor && currentColor) {
      const updatedColors = {
        ...customColors,
        [editingColor]: currentColor,
      };

      setCustomColors(updatedColors);
      setCustomTheme(updatedColors);
      setEditingColor(null);
    }
  };

  const startEditingColor = (colorKey: keyof ThemeColors) => {
    setEditingColor(colorKey);
    setCurrentColor(customColors[colorKey]);
  };

  const cancelColorEditing = () => {
    setEditingColor(null);
    setCurrentColor('');
  };

  const renderThemeOption = (name: ThemeName, label: string) => {
    const themeColors = name === 'custom' ? customColors : themes[name];

    return (
      <TouchableOpacity
        style={[
          styles.themeOption,
          selectedTheme === name && { borderColor: theme.primary, borderWidth: 2 },
        ]}
        onPress={() => handleSelectTheme(name)}
      >
        <View style={styles.themePreview}>
          <View style={[styles.previewHeader, { backgroundColor: themeColors.primary }]}>
            <View style={styles.previewButtons}>
              <View style={styles.previewButton} />
              <View style={styles.previewButton} />
              <View style={styles.previewButton} />
            </View>
          </View>
          <View style={[styles.previewBody, { backgroundColor: themeColors.background }]}>
            <View style={[styles.previewItem, { backgroundColor: themeColors.surface }]} />
            <View style={[styles.previewItem, { backgroundColor: themeColors.surface }]} />
            <View style={[styles.previewAccent, { backgroundColor: themeColors.secondary }]} />
          </View>
        </View>
        <Text style={[styles.themeLabel, { color: theme.text }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderColorSwatch = (colorKey: keyof ThemeColors, label: string) => {
    return (
      <TouchableOpacity
        style={[
          styles.colorSwatch,
          { backgroundColor: customColors[colorKey] },
          editingColor === colorKey && styles.selectedSwatch,
        ]}
        onPress={() => startEditingColor(colorKey)}
      >
        <Text
          style={[
            styles.swatchLabel,
            { color: isLightColor(customColors[colorKey]) ? '#000' : '#fff' },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const isLightColor = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Choose Theme</Text>

        <View style={styles.themeOptions}>
          {renderThemeOption('light', 'Light')}
          {renderThemeOption('dark', 'Dark')}
          {renderThemeOption('blue', 'Blue')}
          {renderThemeOption('custom', 'Custom')}
        </View>

        {selectedTheme === 'custom' && (
          <View style={styles.customizeSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Customize Colors</Text>

            <View style={styles.colorSwatches}>
              {renderColorSwatch('primary', 'Primary')}
              {renderColorSwatch('secondary', 'Secondary')}
              {renderColorSwatch('background', 'Background')}
              {renderColorSwatch('surface', 'Surface')}
              {renderColorSwatch('text', 'Text')}
              {renderColorSwatch('error', 'Error')}
              {renderColorSwatch('success', 'Success')}
              {renderColorSwatch('walls', 'Walls')}
              {renderColorSwatch('ball', 'Ball')}
              {renderColorSwatch('goal', 'Goal')}
            </View>

            {editingColor && (
              <View style={[styles.colorPickerContainer, { backgroundColor: theme.surface }]}>
                <Text style={[styles.colorTitle, { color: theme.text }]}>
                  {editingColor.charAt(0).toUpperCase() + editingColor.slice(1)}:{' '}
                  {currentColor || customColors[editingColor]}
                </Text>
                <View
                  style={{
                    height: 300,
                    width: '100%',
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.1)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    padding: 5,
                  }}
                >
                  <ColorPicker
                    color={currentColor || customColors[editingColor]}
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
                    style={[styles.colorButton, { backgroundColor: theme.error }]}
                    onPress={cancelColorEditing}
                  >
                    <Text style={styles.colorButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.colorButton, { backgroundColor: theme.primary }]}
                    onPress={applyColorChange}
                  >
                    <Text style={styles.colorButtonText}>Apply</Text>
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
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 16,
  },
  themeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  themeOption: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  themePreview: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '500',
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
    marginTop: 16,
  },
  colorSwatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorSwatch: {
    width: '30%',
    aspectRatio: 1.5,
    borderRadius: 8,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedSwatch: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  colorPickerContainer: {
    padding: 16,
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minHeight: 400,
  },
  colorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  colorButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  colorButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: '48%',
    alignItems: 'center',
  },
  colorButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ThemeScreen;
