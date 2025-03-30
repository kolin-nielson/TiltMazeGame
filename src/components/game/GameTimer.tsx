import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { gameScreenStyles } from '../../styles/GameScreenStyles';
import { useTheme } from '../../contexts/ThemeContext';

interface GameTimerProps {
  formattedTime: string;
}

export const GameTimer: React.FC<GameTimerProps> = ({ formattedTime }) => {
  const { theme } = useTheme();
  
  return (
    <View 
      style={[
        gameScreenStyles.timerContainer, 
        styles.timerContainer,
        { 
          backgroundColor: theme.surface,
          elevation: 1,
          shadowColor: theme.onBackground,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.18,
          shadowRadius: 1.0,
        }
      ]}
    >
      <Text 
        style={[
          gameScreenStyles.timerText, 
          styles.timerText,
          { 
            color: theme.primary,
          }
        ]}
      >
        {formattedTime}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  timerText: {
    fontWeight: '500',
    letterSpacing: 0.5,
  }
});
