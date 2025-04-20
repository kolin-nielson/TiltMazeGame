import React from 'react';
import { Appbar, IconButton } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { ThemeColors } from '@types';
import { gameScreenStyles } from '@styles/GameScreenStyles';

interface GameHeaderProps {
  score: number;
  onQuit: () => void;
  onCalibrate: () => void;
  colors: ThemeColors;
}

const GameHeader: React.FC<GameHeaderProps> = ({ score, onQuit, onCalibrate, colors }) => {
  return (
    <Appbar.Header style={[styles.header, { backgroundColor: colors.surface }]} mode="center-aligned">
      <IconButton
        icon="exit-to-app"
        size={24}
        iconColor={colors.primary}
        onPress={onQuit}
        accessibilityLabel="Quit game"
        accessibilityHint="Opens a confirmation dialog to quit the game"
        style={styles.iconButton}
      />
      <Appbar.Content
        title={String(score)}
        subtitle="Score"
        titleStyle={[gameScreenStyles.appbarTitle, { color: colors.onSurface, fontSize: 20 }]}
        subtitleStyle={{ color: colors.onSurfaceVariant, fontSize: 12 }}
        style={styles.content}
      />
      <IconButton
        icon="cellphone-settings"
        size={24}
        iconColor={colors.primary}
        onPress={onCalibrate}
        accessibilityLabel="Calibrate tilt controls"
        accessibilityHint="Resets the tilt orientation to your current device position"
        style={styles.iconButton}
      />
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    paddingHorizontal: 16,
  },
  content: {
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 8,
  },
});

export default React.memo(GameHeader);
