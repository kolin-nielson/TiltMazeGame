import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useMazes } from '../contexts/MazeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

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
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.settingsGroup}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Game Settings</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <MaterialIcons name="speed" size={24} color={theme.text} style={styles.icon} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>Sensitivity</Text>
          </View>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={2.0}
              step={0.1}
              value={settings.sensitivity}
              onValueChange={handleSensitivityChange}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.text + '40'}
              thumbTintColor={theme.primary}
            />
            <Text style={[styles.sensitivityValue, { color: theme.text }]}>
              {settings.sensitivity.toFixed(1)}x
            </Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <MaterialIcons name="volume-up" size={24} color={theme.text} style={styles.icon} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>Sound</Text>
          </View>
          <Switch
            trackColor={{ false: '#767577', true: theme.primary + '80' }}
            thumbColor={settings.soundEnabled ? theme.primary : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={handleSoundToggle}
            value={settings.soundEnabled}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <MaterialIcons name="vibration" size={24} color={theme.text} style={styles.icon} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>Vibration</Text>
          </View>
          <Switch
            trackColor={{ false: '#767577', true: theme.primary + '80' }}
            thumbColor={settings.vibrationEnabled ? theme.primary : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={handleVibrationToggle}
            value={settings.vibrationEnabled}
          />
        </View>
      </View>

      <View style={styles.settingsGroup}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>

        <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('Theme')}>
          <View style={styles.settingLabelContainer}>
            <MaterialIcons name="palette" size={24} color={theme.text} style={styles.icon} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>Theme</Text>
          </View>
          <View style={styles.valueContainer}>
            <Text style={[styles.settingValue, { color: theme.text }]}>
              {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.text}
              style={styles.chevron}
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsGroup}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Data</Text>

        <TouchableOpacity style={styles.settingRow} onPress={handleResetProgress}>
          <View style={styles.settingLabelContainer}>
            <MaterialIcons
              name="delete-forever"
              size={24}
              color={theme.error}
              style={styles.icon}
            />
            <Text style={[styles.settingLabel, { color: theme.error }]}>Reset Progress</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.text + '80' }]}>Tilt Maze v1.0.0</Text>
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
  },
  icon: {
    marginRight: 12,
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
  },
});

export default SettingsScreen;
