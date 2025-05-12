import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { gameScreenStyles } from '@styles/GameScreenStyles';
import { useAppSelector, RootState } from '@store';
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
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  return (
    <View style={[gameScreenStyles.overlay, { backgroundColor: `${colors.background}CC` }]}>
      <Card
        style={[gameScreenStyles.messageCard, { backgroundColor: colors.surface }]}
        elevation={3}
      >
        <Card.Title
          title="Game Paused"
          titleVariant="titleLarge"
          titleStyle={[gameScreenStyles.cardTitle, { color: colors.onSurface }]}
        />
        <Card.Actions style={gameScreenStyles.cardActions}>
          <Button
            mode="contained"
            onPress={onResume}
            style={[styles.button, { backgroundColor: colors.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={{ color: colors.onPrimary }}
          >
            Resume
          </Button>
          <Button
            mode="outlined"
            onPress={onRestart}
            style={[styles.button, { borderColor: colors.outline || colors.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={{ color: colors.primary }}
          >
            Restart
          </Button>
          <Button
            mode="outlined"
            onPress={onExit}
            style={[styles.button, { borderColor: colors.outline || colors.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={{ color: colors.primary }}
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
