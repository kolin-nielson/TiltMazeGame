import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { gameScreenStyles } from '../../styles/GameScreenStyles';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { theme } = useTheme();
  
  return (
    <View style={[
      gameScreenStyles.overlay, 
      { backgroundColor: `${theme.background}CC` }
    ]}>
      <Card 
        style={[gameScreenStyles.messageCard, { backgroundColor: theme.surface }]} 
        elevation={3}
      >
        <Card.Title
          title="Game Paused"
          titleVariant="titleLarge"
          titleStyle={[gameScreenStyles.cardTitle, { color: theme.onSurface }]}
        />
        <Card.Actions style={gameScreenStyles.cardActions}>
          <Button
            mode="contained"
            onPress={onResume}
            style={[styles.button, { backgroundColor: theme.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={{ color: theme.onPrimary }}
          >
            Resume
          </Button>
          <Button
            mode="outlined"
            onPress={onRestart}
            style={[styles.button, { borderColor: theme.outline || theme.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={{ color: theme.primary }}
          >
            Restart
          </Button>
          <Button
            mode="outlined"
            onPress={onExit}
            style={[styles.button, { borderColor: theme.outline || theme.primary }]}
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
    borderRadius: 20,
    height: 40,
  },
  buttonContent: {
    height: 40,
  },
});
