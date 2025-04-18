import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAppSelector, useAppDispatch, RootState } from '../store';
import { updateSettings, saveSettings } from '../store/slices/settingsSlice';
import { resetMazeProgress } from '../store/slices/mazeSlice';
import { useNavigation } from '@react-navigation/native';
import { SettingsScreenNavigationProp } from '../navigation/types';

type SettingItemProps = {
  label: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  labelColor?: string;
  onPress?: () => void;
  children?: React.ReactNode;
};

const SettingItem: React.FC<SettingItemProps> = ({
  label,
  iconName,
  iconColor,
  labelColor,
  onPress,
  children,
}) => {
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  const itemIconColor = iconColor || colors?.primary || '#6200ee';
  const itemLabelColor = labelColor || colors?.onSurface || '#000000';

  const Content = (
    <View style={[styles.settingRow, {
      backgroundColor: colors?.surface ?? '#ffffff',
      shadowColor: colors?.onBackground ?? '#000000',
    }]}>
      <View style={styles.settingLabelContainer}>
        <MaterialIcons name={iconName} size={24} color={itemIconColor} style={styles.icon} />
        <Text style={[styles.settingLabel, { color: itemLabelColor }]}>{label}</Text>
      </View>
      {children}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{Content}</TouchableOpacity>;
  }

  return Content;
};

const SettingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  const themeName = useAppSelector((state: RootState) => state.theme.themeName);
  const settings = useAppSelector((state: RootState) => state.settings);
  const insets = useSafeAreaInsets();

  const handleSoundToggle = (value: boolean) => {
    dispatch(updateSettings({ soundEnabled: value }));
    dispatch(saveSettings({ soundEnabled: value }));
  };

  const handleVibrationToggle = (value: boolean) => {
    dispatch(updateSettings({ vibrationEnabled: value }));
    dispatch(saveSettings({ vibrationEnabled: value }));
  };

  const [sliderValue, setSliderValue] = useState<number>(settings.sensitivity);
  const [isSliding, setIsSliding] = useState<boolean>(false);

  // Update local state when settings change from outside
  useEffect(() => {
    if (!isSliding) {
      setSliderValue(settings.sensitivity);
    }
  }, [settings.sensitivity, isSliding]);

  // Debounced sensitivity change handler
  const handleSensitivityChange = useCallback((value: number) => {
    setSliderValue(value);
  }, []);

  // Only update actual settings when sliding completes
  const handleSlidingComplete = useCallback((value: number) => {
    setIsSliding(false);
    dispatch(updateSettings({ sensitivity: value }));
    dispatch(saveSettings({ sensitivity: value }));
  }, [dispatch]);

  // Track when sliding starts
  const handleSlidingStart = useCallback(() => {
    setIsSliding(true);
  }, []);

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all game progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await dispatch(resetMazeProgress());
            dispatch(updateSettings({ highestScore: 0 }));
            dispatch(saveSettings({ highestScore: 0 }));
            Alert.alert('Success', 'Your progress has been reset.');
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          backgroundColor: colors?.background ?? '#ffffff'
        }
      ]}
    >
      <View style={styles.settingsGroup}>
        <Text style={[styles.sectionTitle, { color: colors?.primary ?? '#6200ee' }]}>Game Settings</Text>

        <SettingItem label="Sensitivity" iconName="speed">
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={2.0}
              step={0.1}
              value={sliderValue}
              onValueChange={handleSensitivityChange}
              onSlidingStart={handleSlidingStart}
              onSlidingComplete={handleSlidingComplete}
              minimumTrackTintColor={colors?.primary ?? '#6200ee'}
              maximumTrackTintColor={colors?.onSurfaceVariant ?? '#cccccc'}
              thumbTintColor={colors?.primary ?? '#6200ee'}
            />
            <Text style={[styles.sensitivityValue, { color: colors?.onSurface ?? '#000000' }]}>
              {sliderValue.toFixed(1)}x
            </Text>
          </View>
        </SettingItem>

        <SettingItem label="Sound" iconName="volume-up">
          <Switch
            trackColor={{ false: colors?.surfaceVariant ?? '#E7E0EB', true: (colors?.primary ?? '#6200ee') + '80' }}
            thumbColor={settings.soundEnabled ? (colors?.primary ?? '#6200ee') : (colors?.onSurfaceVariant ?? '#CAC4CF')}
            ios_backgroundColor={colors?.surfaceVariant ?? '#E7E0EB'}
            onValueChange={handleSoundToggle}
            value={settings.soundEnabled}
          />
        </SettingItem>

        <SettingItem label="Vibration" iconName="vibration">
          <Switch
            trackColor={{ false: colors?.surfaceVariant ?? '#E7E0EB', true: (colors?.primary ?? '#6200ee') + '80' }}
            thumbColor={settings.vibrationEnabled ? (colors?.primary ?? '#6200ee') : (colors?.onSurfaceVariant ?? '#CAC4CF')}
            ios_backgroundColor={colors?.surfaceVariant ?? '#E7E0EB'}
            onValueChange={handleVibrationToggle}
            value={settings.vibrationEnabled}
          />
        </SettingItem>
      </View>

      <View style={styles.settingsGroup}>
        <Text style={[styles.sectionTitle, { color: colors?.primary ?? '#6200ee' }]}>Appearance</Text>

        <SettingItem
          label="Theme"
          iconName="palette"
          onPress={() => navigation.navigate('Theme')}
        >
          <View style={styles.valueContainer}>
            <Text style={[styles.settingValue, { color: colors?.onSurface ?? '#000000' }]}>
              {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colors?.onSurface ?? '#000000'}
              style={styles.chevron}
            />
          </View>
        </SettingItem>
      </View>

      <View style={styles.settingsGroup}>
        <Text style={[styles.sectionTitle, { color: colors?.primary ?? '#6200ee' }]}>Data</Text>

        <SettingItem
          label="Reset Progress"
          iconName="delete-forever"
          iconColor={colors?.error ?? '#B00020'}
          labelColor={colors?.error ?? '#B00020'}
          onPress={handleResetProgress}
        >
        </SettingItem>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors?.onSurfaceVariant ?? '#444444' }]}>Tilt Maze v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  settingsGroup: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    marginLeft: 8,
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginBottom: 8,
    ...(Platform.OS === 'ios'
      ? {
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
        }
      : { elevation: 1 }
    )
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    letterSpacing: 0.15,
  },
  icon: {
    marginRight: 16,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 16,
    opacity: 0.7,
  },
  chevron: {
    marginLeft: 4,
  },
  sliderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sensitivityValue: {
    width: 40,
    textAlign: 'right',
    fontSize: 16,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    fontSize: 14,
    letterSpacing: 0.25,
  },
});

export default SettingsScreen;
