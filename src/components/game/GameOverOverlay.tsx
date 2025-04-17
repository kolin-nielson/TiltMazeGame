import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { gameScreenStyles } from '../../styles/GameScreenStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';

interface GameOverOverlayProps {
  score: number;
  bestScore: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  score,
  bestScore,
  onPlayAgain,
  onExit,
}) => {
  const theme = useTheme();
  const { colors } = useCustomTheme();
  const isNewHighScore = score > bestScore;

  // Create styles with theme colors
  const styles = StyleSheet.create({
    container: {
      ...gameScreenStyles.overlayBase,
      backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker overlay for better contrast
    },
    card: {
      width: '85%',
      maxWidth: 400,
      borderRadius: 20,
      padding: 0,
      overflow: 'hidden',
      elevation: 8,
    },
    cardHeader: {
      backgroundColor: colors.error,
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gameOverText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.onError,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    cardContent: {
      backgroundColor: colors.surface,
      paddingHorizontal: 24,
      paddingVertical: 30,
      alignItems: 'center',
    },
    scoreContainer: {
      width: '100%',
      marginBottom: 24,
    },
    scoreRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 8,
      paddingVertical: 12,
      borderRadius: 12,
    },
    yourScoreRow: {
      backgroundColor: colors.primaryContainer,
    },
    bestScoreRow: {
      backgroundColor: colors.secondaryContainer,
    },
    scoreLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onPrimaryContainer,
    },
    bestScoreLabel: {
      color: colors.onSecondaryContainer,
    },
    scoreValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.onPrimaryContainer,
    },
    bestScoreValue: {
      color: colors.onSecondaryContainer,
    },
    newHighScoreBadge: {
      position: 'absolute',
      top: -10,
      right: -10,
      backgroundColor: colors.tertiary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
      transform: [{ rotate: '15deg' }],
    },
    newHighScoreText: {
      color: colors.onTertiary,
      fontWeight: 'bold',
      fontSize: 12,
    },
    buttonContainer: {
      width: '100%',
      marginTop: 8,
      gap: 16,
    },
    playAgainButton: {
      width: '100%',
      borderRadius: 12,
      paddingVertical: 6,
    },
    exitButton: {
      width: '100%',
      borderRadius: 12,
      borderColor: colors.outline,
      borderWidth: 2,
      paddingVertical: 6,
    },
    buttonLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      paddingVertical: 4,
    },
    iconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonIcon: {
      marginRight: 8,
    },
  });

  return (
    <View style={styles.container}>
      {/* Wrap Card in a View to fix shadow overflow issue */}
      <View style={{ width: '85%', maxWidth: 400 }}>
        <Card style={styles.card}>
        {/* Game Over Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.gameOverText}>Game Over</Text>
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Score Section */}
          <View style={styles.scoreContainer}>
            {/* Your Score */}
            <View style={[styles.scoreRow, styles.yourScoreRow]}>
              <Text style={styles.scoreLabel}>Your Score</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>

            {/* Best Score */}
            <View style={[styles.scoreRow, styles.bestScoreRow, { position: 'relative' }]}>
              <Text style={[styles.scoreLabel, styles.bestScoreLabel]}>Best Score</Text>
              <Text style={[styles.scoreValue, styles.bestScoreValue]}>{bestScore}</Text>

              {/* New High Score Badge */}
              {isNewHighScore && (
                <View style={styles.newHighScoreBadge}>
                  <Text style={styles.newHighScoreText}>NEW!</Text>
                </View>
              )}
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Play Again Button */}
            <Button
              mode="contained"
              onPress={onPlayAgain}
              style={styles.playAgainButton}
              labelStyle={styles.buttonLabel}
              buttonColor={colors.primary}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="refresh"
                  size={20}
                  color={colors.onPrimary}
                  style={styles.buttonIcon}
                />
                <Text style={[styles.buttonLabel, { color: colors.onPrimary }]}>Play Again</Text>
              </View>
            </Button>

            {/* Exit Button */}
            <Button
              mode="outlined"
              onPress={onExit}
              style={styles.exitButton}
              labelStyle={[styles.buttonLabel, { color: colors.error }]}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="exit-to-app"
                  size={20}
                  color={colors.error}
                  style={styles.buttonIcon}
                />
                <Text style={[styles.buttonLabel, { color: colors.error }]}>Exit Game</Text>
              </View>
            </Button>
          </View>
        </View>
      </Card>
      </View>
    </View>
  );
};
