import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Dimensions, BackHandler } from 'react-native';
import { Text, Portal, Snackbar } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { GameScreenNavigationProp } from '@navigation/types';
import * as Haptics from 'expo-haptics';
import { useGyroscope } from '@hooks/useGyroscope';
import Slider from '@react-native-community/slider';

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
} from '@store/slices/gameSlice';
import { usePhysics } from '@hooks/usePhysics';

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

const MAZE_AREA_SIZE = 300;

type GameState = 'loading' | 'playing' | 'game_over';

const GameScreen: React.FC = () => {
  const { width, height } = Dimensions.get('window');
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
    gameOver,
  } = usePhysics(currentMaze, physicsOptions);

  const {
    data: gyroData,
    available: gyroscopeAvailable,
    reset: resetGyroscope,
    isCalibrated: gyroIsCalibrated,
    hasDeviceMovedSignificantly,
  } = useGyroscope(true);

  useEffect(() => {
    if (gameState === 'playing' && gyroscopeAvailable) {
      update(gyroData.x, gyroData.y);
    } else {
      update(0, 0);
    }
  }, [gameState, gyroscopeAvailable, gyroData.x, gyroData.y, update]);

  const handlePlayAgain = useCallback(() => {
    dispatch(setGameState('loading'));

    setTimeout(() => {
      resetPhysics();
      dispatch(setDifficulty(1));
      dispatch(setLevelsCompleted(0));

      const initialMaze = generateMaze(1);
      dispatch(setCurrentMaze(initialMaze));
      dispatch(setGameState('playing'));
    }, 100);
  }, [dispatch, resetPhysics]);

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

      dispatch(setShowLevelTransition(true));
    }
  }, [dispatch, gameState, difficulty, resetPhysics, levelsCompleted, settings.highestScore]);

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

    const currentX = ballPositionX.value;
    const currentY = ballPositionY.value;

    dispatch(
      setDeathPosition({
        x: currentX,
        y: currentY,
      })
    );

    if (settings.vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }, 150);
    }

    dispatch(setShowDeathAnimation(true));
  }, [dispatch, levelsCompleted, settings.highestScore, ballPositionX, ballPositionY]);

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
    <View key={currentMaze?.id ?? 'new'} style={[gameScreenStyles.screen, { backgroundColor: colors?.background ?? '#fff' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <GameHeader
        score={levelsCompleted}
        onQuit={showQuitConfirm}
        onCalibrate={handleResetTilt}
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

      <View style={gameScreenStyles.mazeContainer}>
        <View style={{ width: MAZE_AREA_SIZE, height: MAZE_AREA_SIZE }}>
          <MazeView key={currentMaze?.id}
            maze={currentMaze}
            ballPositionX={ballPositionX}
            ballPositionY={ballPositionY}
            ballRadius={7}
            colors={colors}
            gameState={gameState}
          />
        </View>
      </View>

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

      <SimpleDeathScreen
        visible={showDeathAnimation}
        onAnimationComplete={handleDeathAnimationComplete}
        colors={colors}
      />
    </View>
  );
};

export default GameScreen;
