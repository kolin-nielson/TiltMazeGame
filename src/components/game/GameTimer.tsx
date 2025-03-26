import React from 'react';
import { View, Text } from 'react-native';
import { gameScreenStyles } from '../../styles/GameScreenStyles';
import { useTheme } from '../../contexts/ThemeContext';

interface GameTimerProps {
  formattedTime: string;
}

export const GameTimer: React.FC<GameTimerProps> = ({ formattedTime }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[gameScreenStyles.timerContainer, { backgroundColor: theme.surface }]}>
      <Text style={[gameScreenStyles.timerText, { color: theme.primary }]}>{formattedTime}</Text>
    </View>
  );
};
