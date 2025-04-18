import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Dimensions, BackHandler } from 'react-native';
import { Text, Portal, Snackbar, Button, Dialog, Surface, Appbar } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useAppSelector, useAppDispatch, RootState } from '../store';
import { updateSettings, saveSettings } from '../store/slices/settingsSlice';
import { updateHighestEndlessLevel, saveMazeProgress, setCurrentMaze } from '../store/slices/mazeSlice';
import {
  setGameState,
  setDifficulty,
  setLevelsCompleted,
  setGoalReached,
  setGameOver,
  setShowCalibrationOverlay,
  setShowLevelTransition,
  setShowDeathAnimation,
  setDeathPosition,
  setGyroscopeCalibrated,
  setIsManualRecalibrating
} from '../store/slices/gameSlice';
import { usePhysics } from '../hooks/usePhysics';
import { useGyroscope } from '../hooks/useGyroscope';

import { GameScreenNavigationProp } from '../navigation/types';
import { gameScreenStyles } from '../styles/GameScreenStyles';
import { generateMaze } from '../utils/mazeGenerator';
import { Maze } from '../types';
import { GAME } from '../config/constants';

import { GameOverOverlay } from '../components/game/GameOverOverlay';
import TiltCalibrationOverlay from '../components/game/TiltCalibrationOverlay';
import LevelTransition from '../components/game/LevelTransition';
import BasicDeathAnimation from '../components/game/BasicDeathAnimation';
import GameHeader from '../components/game/GameHeader';
import QuitConfirmDialog from '../components/game/QuitConfirmDialog';
import MazeView from '../components/game/MazeView';

type GameState = 'loading' | 'playing' | 'game_over';

const GameScreen: React.FC = () => {
  const { width, height } = Dimensions.get('window');
  const dispatch = useAppDispatch();
  const navigation = useNavigation<GameScreenNavigationProp>();
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  const isDark = useAppSelector((state: RootState) => state.theme.isDark);
  const settings = useAppSelector((state: RootState) => state.settings);

  // Game state from Redux
  const gameState = useAppSelector((state: RootState) => state.game.gameState) as GameState;
  const currentMaze = useAppSelector((state: RootState) => state.maze.currentMaze);
  const difficulty = useAppSelector((state: RootState) => state.game.difficulty);
  const levelsCompleted = useAppSelector((state: RootState) => state.game.levelsCompleted);
  const gyroscopeCalibrated = useAppSelector((state: RootState) => state.game.gyroscopeCalibrated);
  const isManualRecalibrating = useAppSelector((state: RootState) => state.game.isManualRecalibrating);
  const showCalibrationOverlay = useAppSelector((state: RootState) => state.game.showCalibrationOverlay);
  const showLevelTransition = useAppSelector((state: RootState) => state.game.showLevelTransition);
  const showDeathAnimation = useAppSelector((state: RootState) => state.game.showDeathAnimation);
  const deathPosition = useAppSelector((state: RootState) => state.game.deathPosition);

  // Local state
  const [isQuitConfirmVisible, setIsQuitConfirmVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const recalibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const physicsOptions = {
    width,
    height,
    gravityScale: 0.015,
    ballRadius: 7,
    vibrationEnabled: settings.vibrationEnabled,
  };

  const {
    ballPositionX,
    ballPositionY,
    update,
    reset: resetPhysics,
    goalReached,
    gameOver
  } = usePhysics(currentMaze, physicsOptions);

  const {
    data: gyroData,
    available: gyroscopeAvailable,
    reset: resetGyroscope,
    isCalibrated: gyroIsCalibrated,
    hasDeviceMovedSignificantly,
  } = useGyroscope(true);

  useEffect(() => {
    if (gameState === 'loading') {
      handlePlayAgain();
    }
  }, [gameState, handlePlayAgain]);

  useEffect(() => {
    if (gameState === 'playing' && !gyroIsCalibrated && gyroscopeAvailable) {
      resetGyroscope();
      setGyroscopeCalibrated(true);
    } else if (gyroIsCalibrated && !gyroscopeCalibrated) {
      setGyroscopeCalibrated(true);
    }
  }, [gameState, gyroscopeCalibrated, gyroIsCalibrated, gyroscopeAvailable, resetGyroscope]);

  const handlePlayAgain = useCallback(() => {
    dispatch(setGameState('loading'));

    setTimeout(() => {
      if (resetPhysics) {
        resetPhysics();
      }

      dispatch(setDifficulty(1));
      dispatch(setLevelsCompleted(0));

      const initialMaze = generateMaze(1);

      dispatch(setCurrentMaze(initialMaze));
      dispatch(setGameState('playing'));
    }, 100);
  }, [dispatch, resetPhysics]);

  const handleGoalReachedAndNextLevel = useCallback(() => {
    if (gameState === 'playing') {
      if (resetPhysics) {
        resetPhysics();
      }

      const completedLevelNumber = difficulty;
      const newLevelCount = levelsCompleted + 1;
      dispatch(setLevelsCompleted(newLevelCount));
      dispatch(updateHighestEndlessLevel(completedLevelNumber));
      dispatch(saveMazeProgress());

      if (newLevelCount > (settings.highestScore || 0)) {
        dispatch(updateSettings({ highestScore: newLevelCount }));
        dispatch(saveSettings({ highestScore: newLevelCount }));
      }

      // Show level transition before generating new maze
      dispatch(setShowLevelTransition(true));

      // The actual level transition will happen when the animation completes
      // See handleLevelTransitionComplete
    }
  }, [
    dispatch,
    gameState,
    difficulty,
    resetPhysics,
    levelsCompleted,
    settings.highestScore
  ]);
  useEffect(() => {
    if (gameState === 'playing' && gyroscopeAvailable && update) {
      update(gyroData.x, gyroData.y);
    } else if (gameState !== 'playing' && update) {
      update(0, 0);
    }
  }, [gameState, gyroscopeAvailable, update, gyroData]);

  useEffect(() => {
    if (
      gameState === 'playing' &&
      gyroscopeAvailable &&
      !isManualRecalibrating &&
      gyroIsCalibrated &&
      hasDeviceMovedSignificantly()
    ) {
      resetGyroscope();
    }
  }, [
    gameState,
    gyroscopeAvailable,
    gyroIsCalibrated,
    isManualRecalibrating,
    hasDeviceMovedSignificantly,
    resetGyroscope,
  ]);

  useEffect(() => {
    if (gameState === 'playing') {
      if (gameOver) {
        handleGameOver();
      } else if (goalReached) {
        handleGoalReachedAndNextLevel();
      }
    }
  }, [gameState, gameOver, goalReached]);

  useEffect(() => {
    const handleBackPress = () => {
      if (gameState === 'playing') {
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [gameState]);

  const handleGameOver = useCallback(() => {
    if (levelsCompleted > (settings.highestScore || 0)) {
      dispatch(updateSettings({ highestScore: levelsCompleted }));
      dispatch(saveSettings({ highestScore: levelsCompleted }));
    }

    // Get current ball position for death animation
    // Make sure to get the latest values from the shared values
    const currentX = ballPositionX.value;
    const currentY = ballPositionY.value;

    dispatch(setDeathPosition({
      x: currentX,
      y: currentY
    }));

    // Add strong haptic feedback for death
    if (settings.vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Add a second haptic feedback after a short delay for emphasis
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }, 150);
    }

    // Show death animation
    dispatch(setShowDeathAnimation(true));

    // Game over state will be set after animation completes
  }, [dispatch, levelsCompleted, settings.highestScore, ballPositionX, ballPositionY]);

  const handleDeathAnimationComplete = useCallback(() => {
    // Hide the death animation
    dispatch(setShowDeathAnimation(false));

    // Add a slight delay before showing the game over screen
    // This gives the player a moment to process what happened
    setTimeout(() => {
      dispatch(setGameState('game_over'));

      // Add a subtle haptic feedback when the game over screen appears
      if (settings.vibrationEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 300);
  }, [dispatch, settings.vibrationEnabled]);

  const handleLevelTransitionComplete = useCallback(() => {
    dispatch(setShowLevelTransition(false));

    // Now actually change the level
    const nextDifficulty = Math.min(difficulty + 1, GAME.MAX_DIFFICULTY);
    const nextMaze = generateMaze(nextDifficulty);

    dispatch(setDifficulty(nextDifficulty));
    dispatch(setCurrentMaze(nextMaze));
    dispatch(setGameState('playing'));
  }, [dispatch, difficulty, GAME.MAX_DIFFICULTY]);

  const handleExit = () => navigation.goBack();

  const showQuitConfirm = () => setIsQuitConfirmVisible(true);
  const hideQuitConfirm = () => setIsQuitConfirmVisible(false);

  const handleQuitConfirm = () => {
    hideQuitConfirm();
    handleGameOver();
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
    // Only reset the gyroscope, don't regenerate the maze
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
        onCalibrate={handleResetTilt}
        colors={colors}
      />

      <MazeView
        maze={currentMaze}
        ballPositionX={ballPositionX}
        ballPositionY={ballPositionY}
        ballRadius={7}
        colors={colors}
        gameState={gameState}
      />

      <Portal>
        <QuitConfirmDialog
          visible={isQuitConfirmVisible}
          onDismiss={hideQuitConfirm}
          onConfirm={handleQuitConfirm}
          colors={colors}
        />
      </Portal>

      {gameState === 'game_over' && (
        <Portal>
          <GameOverOverlay
            score={levelsCompleted}
            bestScore={settings.highestScore ?? 0}
            onPlayAgain={handlePlayAgain}
            onExit={handleExit}
          />
        </Portal>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
        style={{
            backgroundColor: colors?.inverseSurface ?? colors?.onSurface,
            marginBottom: 50
        }}
        theme={{ colors: {
            inverseSurface: colors?.surface,
            inverseOnSurface: colors?.inverseOnSurface ?? colors?.surface
        } }}
      >
         <Text style={{ color: colors?.inverseOnSurface ?? colors?.surface }}>Tilt orientation reset!</Text>
      </Snackbar>

      {showCalibrationOverlay && (
        <Portal>
          <TiltCalibrationOverlay
            onCalibrationComplete={handleCalibrationComplete}
            colors={colors}
            duration={2000}
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

      {/* Full-screen death animation */}
      <BasicDeathAnimation
        visible={showDeathAnimation}
        position={deathPosition}
        onAnimationComplete={handleDeathAnimationComplete}
        colors={colors}
      />
    </View>
  );
};

export default GameScreen;
