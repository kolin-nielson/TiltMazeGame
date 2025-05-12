import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useAppSelector, useAppDispatch, RootState } from '@store';
import { setTheme, saveTheme, setIsDark } from '@store/slices/themeSlice';
import { ThemeColors, ThemeName } from '@types';
import { lightTheme, darkTheme } from '@styles/themes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const themes: Record<ThemeName, ThemeColors> = {
  light: lightTheme,
  dark: darkTheme,
  system: lightTheme,
};
const ThemeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const themeName = useAppSelector((state: RootState) => state.theme.themeName);
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(themeName);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    setSelectedTheme(themeName);
  }, [themeName]);
  const handleSelectTheme = (name: ThemeName) => {
    setSelectedTheme(name);
    dispatch(setTheme(name));
    dispatch(saveTheme(name));
    if (name === 'dark') {
      dispatch(setIsDark(true));
    } else if (name === 'light') {
      dispatch(setIsDark(false));
    }
  };
  const renderThemeOption = (name: ThemeName, label: string) => {
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
            <View
              style={[styles.previewAccent, { backgroundColor: themeOptionColors.secondary }]}
            />
          </View>
        </View>
        <Text style={[styles.themeLabel, { color: colors?.onSurface ?? '#000' }]}>{label}</Text>
      </TouchableOpacity>
    );
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors?.background ?? '#fff' }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors?.primary ?? '#6200ee', marginTop: 16 }]}>
          Choose Theme
        </Text>
        <View style={styles.themeOptions}>
          {renderThemeOption('light', 'Light')}
          {renderThemeOption('dark', 'Dark')}
          {renderThemeOption('system', 'System')}
        </View>
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
