import React from 'react';
import { Text } from 'react-native';
import { Surface } from 'react-native-paper';
import { Position } from '../../types';
import { gameScreenStyles } from '../../styles/GameScreenStyles';

interface GameDebugInfoProps {
  position: Position;
  gyroscopeAvailable: boolean;
  hapticEnabled: boolean;
}

export const GameDebugInfo: React.FC<GameDebugInfoProps> = ({
  position,
  gyroscopeAvailable,
  hapticEnabled,
}) => {
  return (
    <Surface style={gameScreenStyles.debugSurface} elevation={2}>
      <Text style={gameScreenStyles.debugText}>
        Position: ({position.x.toFixed(1)}, {position.y.toFixed(1)})
      </Text>
      <Text style={gameScreenStyles.debugText}>
        Gyroscope: {gyroscopeAvailable ? 'Available' : 'Not Available'}
      </Text>
      <Text style={gameScreenStyles.debugText}>Haptic: {hapticEnabled ? 'On' : 'Off'}</Text>
    </Surface>
  );
};
