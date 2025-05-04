/* eslint-disable import/no-unresolved */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, BackHandler, Alert } from 'react-native';
import { Text, Snackbar, Portal } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { GameScreenNavigationProp } from '@navigation/types';
import * as Haptics from 'expo-haptics';
import { useGyroscope } from '@hooks/useGyroscope';
import Slider from '@react-native-community/slider';
import Animated from 'react-native-reanimated';

import { useAppSelector, useAppDispatch, RootState } from '@store';
import { updateSettings, saveSettings } from '@store/slices/settingsSlice';
import {
  updateHighestEndlessLevel,
  saveMazeProgress,
  setCurrentMaze,
} from '@store/slices/mazeSlice';
import {
  setGameState,
  setDifficulty,
  setLevelsCompleted,
  setShowCalibrationOverlay,
  setShowLevelTransition,
  setShowDeathAnimation,
  setDeathPosition,
  setGyroscopeCalibrated,
  setIsManualRecalibrating,
  setGameOver,
  resetGame,
  continueAfterAd,
} from '@store/slices/gameSlice';
import { usePhysics } from '@hooks/usePhysics';
import { collectCoinAndSave } from '@store/slices/shopSlice';
import { showRewardedAd } from '../services/adsService';


import { gameScreenStyles } from '@styles/GameScreenStyles';
import { generateMaze } from '@utils/mazeGenerator';

import { GAME } from '@config/constants';

import { GameOverOverlay } from '@components/game/GameOverOverlay';
import TiltCalibrationOverlay from '@components/game/TiltCalibrationOverlay';
import LevelTransition from '@components/game/LevelTransition';
import SimpleDeathScreen from '@components/game/SimpleDeathScreen';
import GameHeader from '@components/game/GameHeader';
import QuitConfirmDialog from '@components/game/QuitConfirmDialog';
import MazeView from '@components/game/MazeView';
import { Maze } from '@types';
import type { PhysicsOptions } from '@hooks/usePhysics';

type GameState = 'loading' | 'playing' | 'game_over';

type PhysicsMazeProps = {
  maze: Maze;
  gyroX: number;
  gyroY: number;
  gameState: GameState;
  isTransitioning: boolean;
  isDying: boolean;
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  update: (gyroX: number, gyroY: number, resetVelocity?: boolean) => void;
  colors: any;
  ballRadius: number;
};

const PhysicsMaze: React.FC<PhysicsMazeProps> = ({
  maze,
  gyroX,
  gyroY,
  gameState,
  isTransitioning,
  isDying,
  ballPositionX,
  ballPositionY,
  update,
  colors,
  ballRadius,
}) => {
  // Track previous game state to detect transitions
  const prevGameStateRef = useRef<GameState | null>(null);

  useEffect(() => {
    // Detect transition to playing state
    const wasNotPlaying = prevGameStateRef.current !== 'playing';
    const isNowPlaying = gameState === 'playing';
    const justStartedPlaying = wasNotPlaying && isNowPlaying && !isTransitioning && !isDying;

    // Update previous state reference
    prevGameStateRef.current = gameState;

    // Pause ball movement during level transitions, death animation, or when not playing
    const frozen = isTransitioning || isDying || gameState !== 'playing';
    const effectiveX = !frozen ? gyroX : 0;
    const effectiveY = !frozen ? gyroY : 0;

    // If we just started playing, force zero velocity by passing a special flag
    const frameId = requestAnimationFrame(() => {
      update(effectiveX, effectiveY, justStartedPlaying);
    });

    return () => cancelAnimationFrame(frameId);
  }, [gyroX, gyroY, gameState, isTransitioning, isDying, update]);

  return (
    <View style={gameScreenStyles.mazeContainer}>
      <View style={gameScreenStyles.mazeSurface}>
        <MazeView
          maze={maze}
          ballPositionX={ballPositionX}
          ballPositionY={ballPositionY}
          ballRadius={ballRadius}
          colors={colors}
          gameState={gameState}
        />
      </View>
    </View>
  );
};

const GameScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<GameScreenNavigationProp>();
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  const isDark = useAppSelector((state: RootState) => state.theme.isDark);
  const settings = useAppSelector((state: RootState) => state.settings);

  const gameState = useAppSelector((state: RootState) => state.game.gameState) as GameState;
  const currentMaze = useAppSelector((state: RootState) => state.maze.currentMaze);
  const difficulty = useAppSelector((state: RootState) => state.game.difficulty);
  const levelsCompleted = useAppSelector((state: RootState) => state.game.levelsCompleted);
  const gyroscopeCalibrated = useAppSelector((state: RootState) => state.game.gyroscopeCalibrated);
  const isManualRecalibrating = useAppSelector(
    (state: RootState) => state.game.isManualRecalibrating
  );
  const showCalibrationOverlay = useAppSelector(
    (state: RootState) => state.game.showCalibrationOverlay
  );
  const showLevelTransition = useAppSelector((state: RootState) => state.game.showLevelTransition);
  const showDeathAnimation = useAppSelector((state: RootState) => state.game.showDeathAnimation);



  const [isQuitConfirmVisible, setIsQuitConfirmVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const recalibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [sliderValue, setSliderValue] = useState<number>(settings.sensitivity);
  const [isSliding, setIsSliding] = useState<boolean>(false);

  useEffect(() => {
    if (!isSliding) {
      setSliderValue(settings.sensitivity);
    }
  }, [settings.sensitivity, isSliding]);

  const handleSensitivityChange = useCallback((value: number) => {
    setSliderValue(value);
  }, []);

  const handleSlidingStart = useCallback(() => {
    setIsSliding(true);
  }, []);

  const handleSlidingComplete = useCallback(
    (value: number) => {
      setIsSliding(false);
      dispatch(updateSettings({ sensitivity: value }));
      dispatch(saveSettings({ sensitivity: value }));
    },
    [dispatch]
  );

  const physicsOptions = {
    width: 300,
    height: 300,
    gravityScale: 0.015,
    ballRadius: 7,
    vibrationEnabled: settings.vibrationEnabled,
    sensitivity: sliderValue,
  };

  const {
    data: gyroData,
    available: gyroscopeAvailable,
    reset: resetGyroscope,
    isCalibrated: gyroIsCalibrated,
    hasDeviceMovedSignificantly,
  } = useGyroscope(true);

  const { ballPositionX, ballPositionY, update, goalReached, gameOver, reset: resetPhysics } = usePhysics(currentMaze, physicsOptions);

  const handlePlayAgain = useCallback(() => {
    dispatch(resetGame());

    // Calibrate gyroscope when starting a new game
    if (gyroscopeAvailable) {
      // First reset immediately to prevent initial movement
      resetGyroscope();
      dispatch(setGyroscopeCalibrated(true));

      // Small delay to ensure game state is reset first
      setTimeout(() => {
        // Then recalibrate after the game state is reset
        resetGyroscope();
        dispatch(setGyroscopeCalibrated(true));

        // Add haptic feedback for better user experience
        if (settings.vibrationEnabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }, 150);
    }
  }, [dispatch, gyroscopeAvailable, resetGyroscope, settings.vibrationEnabled]);

  const handleGameOver = useCallback(() => {
    if (levelsCompleted > (settings.highestScore || 0)) {
      dispatch(updateSettings({ highestScore: levelsCompleted }));
      dispatch(saveSettings({ highestScore: levelsCompleted }));
    }

    if (settings.vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }, 150);
    }

    dispatch(setShowDeathAnimation(true));
    resetPhysics();
  }, [dispatch, levelsCompleted, settings.highestScore, settings.vibrationEnabled, resetPhysics]);

  // Track previous game state to detect transitions for calibration
  const prevGameStateForCalibrationRef = useRef<GameState | null>(null);

  // Effect to handle gyroscope calibration when game state changes to 'playing'
  useEffect(() => {
    // Detect transition to playing state
    const wasNotPlaying = prevGameStateForCalibrationRef.current !== 'playing';
    const isNowPlaying = gameState === 'playing';
    const justStartedPlaying = wasNotPlaying && isNowPlaying;

    // Update previous state reference
    prevGameStateForCalibrationRef.current = gameState;

    // Always calibrate when transitioning to playing state
    if (justStartedPlaying && gyroscopeAvailable) {
      // Give a small delay to ensure the device is stable when the user clicks play
      // This is crucial for proper calibration
      setTimeout(() => {
        // Reset gyroscope to calibrate based on current device position
        resetGyroscope();
        dispatch(setGyroscopeCalibrated(true));

        // Add haptic feedback for better user experience
        if (settings.vibrationEnabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }, 100); // 100ms delay gives enough time for the user to stabilize their device
    }
  }, [gameState, gyroscopeAvailable, resetGyroscope, dispatch, settings.vibrationEnabled]);

  // Handle other calibration cases
  useEffect(() => {
    if (gameState === 'playing' && !gyroIsCalibrated && gyroscopeAvailable) {
      resetGyroscope();
      dispatch(setGyroscopeCalibrated(true));
    } else if (gyroIsCalibrated && !gyroscopeCalibrated) {
      dispatch(setGyroscopeCalibrated(true));
    }
  }, [gameState, gyroscopeCalibrated, gyroIsCalibrated, gyroscopeAvailable, resetGyroscope, dispatch]);

  const handleGoalReachedAndNextLevel = useCallback(() => {
    if (gameState === 'playing') {
      const completedLevelNumber = difficulty;
      const newLevelCount = levelsCompleted + 1;
      dispatch(setLevelsCompleted(newLevelCount));
      dispatch(updateHighestEndlessLevel(completedLevelNumber));
      dispatch(saveMazeProgress());

      if (newLevelCount > (settings.highestScore || 0)) {
        dispatch(updateSettings({ highestScore: newLevelCount }));
        dispatch(saveSettings({ highestScore: newLevelCount }));
      }

      const bonusCoins = Math.floor(difficulty * 1.5);
      if (bonusCoins > 0) {
        for (let i = 0; i < bonusCoins; i++) {
          dispatch(collectCoinAndSave());
        }
      }

      dispatch(setShowLevelTransition(true));
      resetPhysics();
    }
  }, [dispatch, gameState, difficulty, levelsCompleted, settings.highestScore, resetPhysics]);

  useEffect(() => {
    if (
      gameState === 'playing' &&
      !isManualRecalibrating &&
      gyroIsCalibrated &&
      hasDeviceMovedSignificantly()
    ) {
      resetGyroscope();
    }
  }, [
    gameState,
    gyroIsCalibrated,
    isManualRecalibrating,
    hasDeviceMovedSignificantly,
    resetGyroscope,
  ]);

  useEffect(() => {
    if (gameState === 'playing') {
      if (gameOver && !showDeathAnimation) {
        handleGameOver();
      } else if (goalReached && !showLevelTransition) {
        handleGoalReachedAndNextLevel();
      }
    }
  }, [
    gameState,
    gameOver,
    goalReached,
    showDeathAnimation,
    showLevelTransition,
    handleGameOver,
    handleGoalReachedAndNextLevel,
  ]);

  useEffect(() => {
    const handleBackPress = () => {
      if (gameState === 'playing') {
        // Show the quit confirmation dialog when back button is pressed during gameplay
        showQuitConfirm();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [gameState]);

  const handleDeathAnimationComplete = useCallback(() => {
    setTimeout(() => {
      dispatch(setShowDeathAnimation(false));
      dispatch(setGameState('game_over'));

      if (settings.vibrationEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 200);
  }, [dispatch, settings.vibrationEnabled]);

  const handleLevelTransitionComplete = useCallback(() => {
    dispatch(setShowLevelTransition(false));

    const nextDifficulty = Math.min(difficulty + 1, GAME.MAX_DIFFICULTY);
    const nextMaze = generateMaze(nextDifficulty);

    dispatch(setDifficulty(nextDifficulty));
    dispatch(setCurrentMaze(nextMaze));

    // Calibrate gyroscope before setting game state to playing
    // Use a small delay to ensure the device is stable
    if (gyroscopeAvailable) {
      // First reset immediately to prevent initial movement
      resetGyroscope();
      dispatch(setGyroscopeCalibrated(true));

      // Then set a small delay before setting the game state to playing
      // This ensures the calibration is complete before gameplay starts
      setTimeout(() => {
        // Recalibrate once more for stability
        resetGyroscope();
        dispatch(setGyroscopeCalibrated(true));

        // Now set the game state to playing
        dispatch(setGameState('playing'));
      }, 150);
    } else {
      // If gyroscope is not available, just set the game state to playing
      dispatch(setGameState('playing'));
    }
  }, [dispatch, difficulty, GAME.MAX_DIFFICULTY, gyroscopeAvailable, resetGyroscope]);

  const handleExit = useCallback(() => {
    // Ensure the game state is completely reset before navigating back
    dispatch(resetGame());
    // Use a small timeout to ensure the state is reset before navigation
    setTimeout(() => {
      navigation.goBack();
    }, 50);
  }, [dispatch, navigation]);

  const onContinuePlaying = useCallback(() => {
    // Continue from the current level instead of resetting
    dispatch(continueAfterAd());

    // Reset the physics engine to restart the level
    resetPhysics();

    // Calibrate gyroscope when continuing after ad
    if (gyroscopeAvailable) {
      // First reset immediately to prevent initial movement
      resetGyroscope();
      dispatch(setGyroscopeCalibrated(true));

      // Add haptic feedback for better user experience
      if (settings.vibrationEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Then recalibrate after a small delay to ensure stability
      setTimeout(() => {
        resetGyroscope();
        dispatch(setGyroscopeCalibrated(true));
      }, 150);
    }
  }, [dispatch, resetPhysics, gyroscopeAvailable, resetGyroscope, settings.vibrationEnabled]);

  const handleWatchAd = useCallback(async () => {
    const adShown = await showRewardedAd(onContinuePlaying);

    if (!adShown) {
      // Ad failed to show, inform the user
      Alert.alert(
        'Continue',
        'Unable to continue at this time. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  }, [onContinuePlaying]);

  const showQuitConfirm = () => setIsQuitConfirmVisible(true);
  const hideQuitConfirm = () => setIsQuitConfirmVisible(false);

  const handleQuitConfirm = () => {
    hideQuitConfirm();
    // Reset the game state completely instead of triggering game over
    dispatch(resetGame());
    navigation.goBack();
  };

  const handleResetTilt = useCallback(() => {
    if (recalibrationTimeoutRef.current) {
      clearTimeout(recalibrationTimeoutRef.current);
    }

    dispatch(setIsManualRecalibrating(true));
    dispatch(setShowCalibrationOverlay(true));
  }, []);

  const handleCalibrationComplete = useCallback(() => {
    resetGyroscope();
    dispatch(setGyroscopeCalibrated(true));
    dispatch(setShowCalibrationOverlay(false));

    if (settings.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSnackbarVisible(true);

    recalibrationTimeoutRef.current = setTimeout(() => {
      dispatch(setIsManualRecalibrating(false));
    }, 500);
  }, [dispatch, resetGyroscope, settings.vibrationEnabled]);

  useEffect(() => {
    return () => {
      if (recalibrationTimeoutRef.current) {
        clearTimeout(recalibrationTimeoutRef.current);
      }
    };
  }, []);



  useEffect(() => {
    if (gameState === 'loading') {
      dispatch(setDifficulty(1));
      dispatch(setLevelsCompleted(0));
      const initialMaze = generateMaze(1);
      dispatch(setCurrentMaze(initialMaze));
      dispatch(setGameState('playing'));
    } else if (gameState === 'playing' && gameOver) {
      // This handles the case when we continue after an ad
      // Reset the gameOver flag to allow playing again
      dispatch(setGameOver(false));
    }
  }, [gameState, gameOver, dispatch]);

  if (gameState === 'loading' || !currentMaze) {
    return (
      <View style={gameScreenStyles.screen}>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={[gameScreenStyles.screen, { backgroundColor: colors?.background ?? '#fff' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <GameHeader
        score={levelsCompleted}
        onQuit={showQuitConfirm}
        colors={colors}
      />

      <View
        style={{
          backgroundColor: colors?.surface,
          marginHorizontal: 16,
          marginVertical: 8,
          padding: 12,
          borderRadius: 8,
          shadowColor: colors?.onSurface,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Text
          style={{
            color: colors?.onSurface,
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 8,
          }}
        >
          Sensitivity: {sliderValue.toFixed(1)}x
        </Text>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={1}
          maximumValue={10}
          step={0.5}
          value={sliderValue}
          onValueChange={handleSensitivityChange}
          onSlidingStart={handleSlidingStart}
          onSlidingComplete={handleSlidingComplete}
          minimumTrackTintColor={colors?.primary}
          maximumTrackTintColor={colors?.onSurfaceVariant}
          thumbTintColor={colors?.primary}
        />
      </View>

      <PhysicsMaze
        maze={currentMaze!}
        gyroX={gyroData.x}
        gyroY={gyroData.y}
        gameState={gameState}
        isTransitioning={showLevelTransition}
        isDying={showDeathAnimation}
        ballPositionX={ballPositionX}
        ballPositionY={ballPositionY}
        update={update}
        colors={colors}
        ballRadius={physicsOptions.ballRadius}
      />

      <Portal>
        <QuitConfirmDialog
          visible={isQuitConfirmVisible}
          onDismiss={hideQuitConfirm}
          onConfirm={handleQuitConfirm}
          colors={colors}
        />

      {gameState === 'game_over' && (
        <Portal>
          <GameOverOverlay
            score={levelsCompleted}
            bestScore={settings.highestScore ?? 0}
            onPlayAgain={handlePlayAgain}
            onExit={handleExit}
            onWatchAd={handleWatchAd}
            onContinuePlaying={onContinuePlaying}
          />
        </Portal>
      )}

      {showCalibrationOverlay && (
        <Portal>
          <TiltCalibrationOverlay
            onCalibrationComplete={handleCalibrationComplete}
            colors={colors}
            duration={2000}
            vibrationEnabled={settings.vibrationEnabled}
          />
        </Portal>
      )}

      {showLevelTransition && (
        <Portal>
          <LevelTransition
            level={difficulty}
            visible={showLevelTransition}
            onTransitionComplete={handleLevelTransitionComplete}
            colors={colors}
          />
        </Portal>
      )}

        <Portal>
      <SimpleDeathScreen
        visible={showDeathAnimation}
        onAnimationComplete={handleDeathAnimationComplete}
        colors={colors}
      />
        </Portal>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={Snackbar.DURATION_SHORT}
          style={{
            backgroundColor: colors?.inverseSurface ?? colors?.onSurface,
            marginBottom: 50,
          }}
          theme={{
            colors: {
              inverseSurface: colors?.surface,
              inverseOnSurface: colors?.inverseOnSurface ?? colors?.surface,
            },
          }}
        >
          <Text style={{ color: colors?.inverseOnSurface ?? colors?.surface }}>
            Tilt orientation reset!
          </Text>
        </Snackbar>
      </Portal>
    </View>
  );
};

export default GameScreen;
