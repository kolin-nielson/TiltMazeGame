import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useMazes } from '../contexts/MazeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

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
  const { theme } = useTheme();
  const itemIconColor = iconColor || theme.primary;
  const itemLabelColor = labelColor || theme.onSurface;

  const Content = (
    <View style={[styles.settingRow, { 
      backgroundColor: theme.surface,
      shadowColor: theme.onBackground,
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

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, themeName, setTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { resetProgress } = useMazes();
  const insets = useSafeAreaInsets();

  const handleSoundToggle = (value: boolean) => {
    updateSettings({ soundEnabled: value });
  };

  const handleVibrationToggle = (value: boolean) => {
    updateSettings({ vibrationEnabled: value });
  };

  const handleSensitivityChange = (value: number) => {
    updateSettings({ sensitivity: value });
  };

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
            await resetProgress();
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
          backgroundColor: theme.background 
        }
      ]}
    >
      <View style={styles.settingsGroup}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Game Settings</Text>

        <SettingItem label="Sensitivity" iconName="speed">
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={2.0}
              step={0.1}
              value={settings.sensitivity}
              onValueChange={handleSensitivityChange}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.onSurface + '40'}
              thumbTintColor={theme.primary}
            />
            <Text style={[styles.sensitivityValue, { color: theme.onSurface }]}>
              {settings.sensitivity.toFixed(1)}x
            </Text>
          </View>
        </SettingItem>

        <SettingItem label="Sound" iconName="volume-up">
          <Switch
            trackColor={{ false: theme.surfaceVariant, true: theme.primary + '80' }}
            thumbColor={settings.soundEnabled ? theme.primary : theme.onSurfaceVariant}
            ios_backgroundColor={theme.surfaceVariant}
            onValueChange={handleSoundToggle}
            value={settings.soundEnabled}
          />
        </SettingItem>

        <SettingItem label="Vibration" iconName="vibration">
          <Switch
            trackColor={{ false: theme.surfaceVariant, true: theme.primary + '80' }}
            thumbColor={settings.vibrationEnabled ? theme.primary : theme.onSurfaceVariant}
            ios_backgroundColor={theme.surfaceVariant}
            onValueChange={handleVibrationToggle}
            value={settings.vibrationEnabled}
          />
        </SettingItem>
      </View>

      <View style={styles.settingsGroup}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Appearance</Text>

        <SettingItem 
          label="Theme" 
          iconName="palette"
          onPress={() => navigation.navigate('Theme')}
        >
          <View style={styles.valueContainer}>
            <Text style={[styles.settingValue, { color: theme.onSurface }]}>
              {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.onSurface}
              style={styles.chevron}
            />
          </View>
        </SettingItem>
      </View>

      <View style={styles.settingsGroup}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Data</Text>

        <SettingItem 
          label="Reset Progress"
          iconName="delete-forever"
          iconColor={theme.error}
          labelColor={theme.error}
          onPress={handleResetProgress}
        >
        </SettingItem>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.onSurface + '80' }]}>Tilt Maze v1.0.0</Text>
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
