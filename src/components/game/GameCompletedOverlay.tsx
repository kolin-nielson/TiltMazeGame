import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Card, Surface } from 'react-native-paper';
import { gameScreenStyles } from '../../styles/GameScreenStyles';
import { useTheme } from '../../contexts/ThemeContext';

interface GameCompletedOverlayProps {
  elapsedTime: string;
  onNextLevel: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export const GameCompletedOverlay: React.FC<GameCompletedOverlayProps> = ({
  elapsedTime,
  onNextLevel,
  onRestart,
  onExit,
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[
      gameScreenStyles.overlay, 
      { backgroundColor: `${theme.background}CC` } 
    ]}>
      <Card 
        style={[gameScreenStyles.messageCard, { backgroundColor: theme.surface }]} 
        elevation={5}
      >
        <Card.Title
          title="Level Completed!"
          titleVariant="headlineMedium"
          titleStyle={[gameScreenStyles.cardTitle, { color: theme.text }]}
        />
        <Card.Content style={gameScreenStyles.cardContent}>
          <Surface 
            style={[
              gameScreenStyles.statsContainer, 
              { backgroundColor: `${theme.primary}22` }
            ]} 
            elevation={3}
          >
            <View style={gameScreenStyles.statsRow}>
              <Text style={[gameScreenStyles.statLabel, { color: theme.text }]}>Time:</Text>
              <Text style={[gameScreenStyles.statValue, { color: theme.primary }]}>{elapsedTime}</Text>
            </View>
          </Surface>
        </Card.Content>
        <Card.Actions style={gameScreenStyles.cardActions}>
          <Button
            mode="contained"
            onPress={onNextLevel}
            style={[styles.button, { backgroundColor: theme.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={{ color: 'white' }}
          >
            Next Level
          </Button>
          <Button
            mode="outlined"
            onPress={onRestart}
            style={[styles.button, { borderColor: theme.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={{ color: theme.primary }}
          >
            Try Again
          </Button>
          <Button
            mode="outlined"
            onPress={onExit}
            style={[styles.button, { borderColor: theme.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={{ color: theme.primary }}
          >
            Exit
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 8,
  },
  buttonContent: {
    height: 44,
  },
});
