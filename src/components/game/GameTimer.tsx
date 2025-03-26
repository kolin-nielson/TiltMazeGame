import React from 'react';
import { View, Text } from 'react-native';
import { gameScreenStyles } from '../../styles/GameScreenStyles';

interface GameTimerProps {
  formattedTime: string;
}

export const GameTimer: React.FC<GameTimerProps> = ({ formattedTime }) => {
  return (
    <View style={gameScreenStyles.timerContainer}>
      <Text style={gameScreenStyles.timerText}>{formattedTime}</Text>
    </View>
  );
};
