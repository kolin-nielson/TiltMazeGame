import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Card, Surface } from 'react-native-paper';
import { gameScreenStyles } from '../../styles/GameScreenStyles';

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
  return (
    <View style={gameScreenStyles.overlay}>
      <Card style={gameScreenStyles.messageCard} elevation={5}>
        <Card.Title
          title="Level Completed!"
          titleVariant="headlineMedium"
          titleStyle={gameScreenStyles.cardTitle}
        />
        <Card.Content style={gameScreenStyles.cardContent}>
          <Surface style={gameScreenStyles.statsContainer} elevation={3}>
            <View style={gameScreenStyles.statsRow}>
              <Text style={gameScreenStyles.statLabel}>Time:</Text>
              <Text style={gameScreenStyles.statValue}>{elapsedTime}</Text>
            </View>
          </Surface>
        </Card.Content>
        <Card.Actions style={gameScreenStyles.cardActions}>
          <Button
            mode="contained"
            onPress={onNextLevel}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Next Level
          </Button>
          <Button
            mode="outlined"
            onPress={onRestart}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Try Again
          </Button>
          <Button
            mode="outlined"
            onPress={onExit}
            style={styles.button}
            contentStyle={styles.buttonContent}
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
