import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Card, Surface } from 'react-native-paper';
import { gameScreenStyles } from '@styles/GameScreenStyles';
import { useAppSelector, RootState } from '@store';
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
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  return (
    <View style={[gameScreenStyles.overlay, { backgroundColor: `${colors.background}CC` }]}>
      <Card
        style={[gameScreenStyles.messageCard, { backgroundColor: colors.surface }]}
        elevation={3}
      >
        <Card.Title
          title="Level Completed!"
          titleVariant="headlineMedium"
          titleStyle={[gameScreenStyles.cardTitle, { color: colors.onSurface }]}
        />
        <Card.Content style={gameScreenStyles.cardContent}>
          <Surface
            style={[
              gameScreenStyles.statsContainer,
              {
                backgroundColor: colors.primaryContainer || `${colors.primary}22`,
                borderRadius: 12,
              },
            ]}
            elevation={1}
          >
            <View style={gameScreenStyles.statsRow}>
              <Text
                style={[
                  gameScreenStyles.statLabel,
                  {
                    color: colors.onPrimaryContainer || colors.onSurface,
                    fontWeight: '500',
                  },
                ]}
              >
                Time:
              </Text>
              <Text
                style={[
                  gameScreenStyles.statValue,
                  {
                    color: colors.onPrimaryContainer || colors.primary,
                    fontWeight: '500',
                  },
                ]}
              >
                {elapsedTime}
              </Text>
            </View>
          </Surface>
        </Card.Content>
        <Card.Actions style={gameScreenStyles.cardActions}>
          <Button
            mode="contained"
            onPress={onNextLevel}
            style={[styles.button, { backgroundColor: colors.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={{ color: colors.onPrimary }}
          >
            Next Level
          </Button>
          <Button
            mode="outlined"
            onPress={onRestart}
            style={[styles.button, { borderColor: colors.outline || colors.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={{ color: colors.primary }}
          >
            Try Again
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
