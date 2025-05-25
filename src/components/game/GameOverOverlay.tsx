import React from 'react';
import { View, StyleSheet, StyleProp, TextStyle, ViewStyle, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { gameScreenStyles } from '@styles/GameScreenStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSelector, RootState } from '@store';
import { ThemeColors } from '@types';
import BannerAd from '@components/common/BannerAd';

interface GameOverOverlayProps {
  score: number;
  bestScore: number;
  onPlayAgain: () => void;
  onExit: () => void;
  onWatchAd: () => void;
  isLoadingAd?: boolean;
}

interface ScoreRowProps {
  label: string;
  value: number;
  style: StyleProp<ViewStyle>;
  labelStyle: StyleProp<TextStyle>;
  valueStyle: StyleProp<TextStyle>;
  showBadge: boolean;
}

const ScoreRow: React.FC<ScoreRowProps> = ({
  label,
  value,
  style,
  labelStyle,
  valueStyle,
  showBadge,
}) => (
  <View style={[style, { position: 'relative' }]}>
    <Text style={labelStyle}>{label}</Text>
    <Text style={valueStyle}>{value}</Text>
    {showBadge && (
      <View style={styles.newHighScoreBadge}>
        <Text style={styles.newHighScoreText}>NEW!</Text>
      </View>
    )}
  </View>
);

type IconName = 'refresh' | 'exit-to-app' | string;

interface ActionButtonProps {
  mode: 'contained' | 'outlined';
  onPress: () => void;
  style: StyleProp<ViewStyle>;
  icon: IconName;
  colors: ThemeColors;
  iconColor: string;
  size?: number;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  mode,
  onPress,
  style,
  icon,
  colors,
  iconColor,
  size = 28,
}) => {
  const backgroundColor = mode === 'contained' ? colors.primary : 'transparent';
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.iconButton,
        style,
        { backgroundColor }
      ]}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons 
        name={icon as any} 
        size={size} 
        color={iconColor} 
      />
    </TouchableOpacity>
  );
};

const GameOverOverlayComponent: React.FC<GameOverOverlayProps> = ({
  score,
  bestScore,
  onPlayAgain,
  onExit,
  onWatchAd,
  isLoadingAd = false
}) => {
  const handleWatchAd = () => {
    onWatchAd();
  };

  const colors = useAppSelector((state: RootState) => state.theme.colors);
  const hasUsedContinue = useAppSelector((state: RootState) => state.game.hasUsedContinue);
  const isNewHighScore = score > bestScore;

  return (
    <View style={styles.container}>
      <View style={styles.cardWrapper}>
        <Card style={styles.card}>
          <View style={styles.cardInner}>
            <View style={[styles.cardHeader, { backgroundColor: colors.error }]}>
              <Text style={[styles.gameOverText, { color: colors.onError }]}>Game Over</Text>
            </View>
            
            <View style={[styles.cardContent, { backgroundColor: colors.surface }]}>
              <View style={styles.scoreContainer}>
                <ScoreRow
                  label="Your Score"
                  value={score}
                  style={[styles.scoreRow, { backgroundColor: colors.primaryContainer }]}
                  labelStyle={[styles.scoreLabel, { color: colors.onPrimaryContainer }]}
                  valueStyle={[styles.scoreValue, { color: colors.onPrimaryContainer }]}
                  showBadge={false}
                />
                <ScoreRow
                  label="Best Score"
                  value={bestScore}
                  style={[styles.scoreRow, { backgroundColor: colors.secondaryContainer }]}
                  labelStyle={[styles.scoreLabel, { color: colors.onSecondaryContainer }]}
                  valueStyle={[styles.scoreValue, { color: colors.onSecondaryContainer }]}
                  showBadge={isNewHighScore}
                />
              </View>

              {/* Banner Ad for additional revenue - optimal placement */}
              <View style={styles.adContainer}>
                <BannerAd 
                  style={styles.bannerAd}
                />
              </View>

              {!hasUsedContinue && (
                <View style={styles.adButtonContainer}>
                  <Button
                    mode="contained"
                    icon={isLoadingAd ? undefined : "play-circle-outline"}
                    onPress={handleWatchAd}
                    buttonColor={colors.primary}
                    textColor={colors.onPrimary}
                    contentStyle={styles.buttonContent}
                    labelStyle={[styles.buttonLabel, { fontSize: 18 }]}
                    style={styles.watchAdButton}
                    disabled={isLoadingAd}
                  >
                    {isLoadingAd ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={colors.onPrimary} />
                        <Text style={[styles.loadingText, { color: colors.onPrimary }]}>Loading Ad...</Text>
                      </View>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <ActionButton
                  mode="contained"
                  onPress={onPlayAgain}
                  style={styles.playAgainButton}
                  icon="refresh"
                  colors={colors}
                  iconColor={colors.onPrimary}
                />
                <ActionButton
                  mode="outlined"
                  onPress={onExit}
                  style={[styles.exitButton, { borderColor: colors.outline }]}
                  icon="exit-to-app"
                  colors={colors}
                  iconColor={colors.error}
                />
              </View>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...gameScreenStyles.overlayBase,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  cardWrapper: {
    width: '85%',
    maxWidth: 400,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 0,
    elevation: 8,
  },
  cardInner: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  cardHeader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameOverText: {
    fontSize: 32,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardContent: {
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
  scoreLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  newHighScoreBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FF8A65',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    transform: [{ rotate: '15deg' }],
  },
  newHighScoreText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  adContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  bannerAd: {
    marginBottom: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 16,
    gap: 24,
  },
  playAgainButton: {
    borderRadius: 30,
    width: 60,
    height: 60,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  exitButton: {
    borderRadius: 30,
    borderWidth: 2,
    width: 60,
    height: 60,
  },
  buttonContent: {
    height: 48,
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  adButtonContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  watchAdButton: {
    width: '100%',
    borderRadius: 24,
    height: 52,
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const GameOverOverlay = React.memo(GameOverOverlayComponent);
