import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppSelector, RootState } from '@store';
import { ThemeColors } from '@types';
export interface SettingItemProps {
  label: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  labelColor?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}
const SettingItem: React.FC<SettingItemProps> = ({ label, iconName, iconColor, labelColor, onPress, children }) => {
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  const itemIconColor = iconColor || colors.primary;
  const itemLabelColor = labelColor || colors.onSurface;
  const Content = (
    <View style={[styles.settingRow, { backgroundColor: colors.surface, shadowColor: colors.onBackground }]}> 
      <View style={styles.settingLabelContainer}>
        <MaterialIcons name={iconName} size={24} color={itemIconColor} style={styles.icon} />
        <Text style={[styles.settingLabel, { color: itemLabelColor }]}>{label}</Text>
      </View>
      {children}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress}>{Content}</TouchableOpacity>;
  return Content;
};
export default SettingItem;
const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginBottom: 8,
    ...(Platform.OS === 'ios'
      ? { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 }
      : { elevation: 1 }),
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
}); 