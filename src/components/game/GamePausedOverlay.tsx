import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { gameScreenStyles } from '../../styles/GameScreenStyles';

interface GamePausedOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export const GamePausedOverlay: React.FC<GamePausedOverlayProps> = ({
  onResume,
  onRestart,
  onExit,
}) => {
  return (
    <View style={gameScreenStyles.overlay}>
      <Card style={gameScreenStyles.messageCard} elevation={5}>
        <Card.Title
          title="Game Paused"
          titleVariant="titleLarge"
          titleStyle={gameScreenStyles.cardTitle}
        />
        <Card.Actions style={gameScreenStyles.cardActions}>
          <Button
            mode="contained"
            onPress={onResume}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Resume
          </Button>
          <Button
            mode="outlined"
            onPress={onRestart}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Restart
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
