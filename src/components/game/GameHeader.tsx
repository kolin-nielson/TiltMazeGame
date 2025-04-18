import React from 'react';
import { Appbar } from 'react-native-paper';
import { ThemeColors } from '../../types';
import { gameScreenStyles } from '../../styles/GameScreenStyles';

interface GameHeaderProps {
  score: number;
  onQuit: () => void;
  onCalibrate: () => void;
  colors: ThemeColors;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  score,
  onQuit,
  onCalibrate,
  colors,
}) => {
  return (
    <Appbar.Header
      style={{ backgroundColor: colors?.surface ?? '#fff' }}
      mode="center-aligned"
    >
      <Appbar.Action
        icon="close"
        onPress={onQuit}
        color={colors?.primary ?? '#6200ee'}
        size={24}
        accessibilityLabel="Quit game"
        accessibilityHint="Opens a confirmation dialog to quit the game"
      />
      <Appbar.Content
        title={`Score: ${score}`}
        titleStyle={[gameScreenStyles.appbarTitle, { color: colors?.onSurface ?? '#000' }]}
      />
      <Appbar.Action
        icon="compass-outline"
        onPress={onCalibrate}
        color={colors?.primary ?? '#6200ee'}
        size={24}
        accessibilityLabel="Calibrate tilt controls"
        accessibilityHint="Resets the tilt orientation to your current device position"
      />
      <Appbar.Content
        title=""
        subtitle="Calibrate"
        subtitleStyle={[gameScreenStyles.calibrateText, { color: colors?.primary ?? '#6200ee' }]}
        style={{ position: 'absolute', right: 0, width: 80, alignItems: 'center' }}
      />
    </Appbar.Header>
  );
};

export default React.memo(GameHeader);
