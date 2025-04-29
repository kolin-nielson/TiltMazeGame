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
} from '@store/slices/gameSlice';
import { usePhysics } from '@hooks/usePhysics';
import { collectCoinAndSave } from '@store/slices/shopSlice';


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
  update: (gyroX: number, gyroY: number) => void;
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
  useEffect(() => {
    // Pause ball movement during level transitions, death animation, or when not playing
    const frozen = isTransitioning || isDying || gameState !== 'playing';
    const effectiveX = !frozen ? gyroX : 0;
    const effectiveY = !frozen ? gyroY : 0;
    update(effectiveX, effectiveY);
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
  }, [dispatch]);

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
    dispatch(setGameState('playing'));
  }, [dispatch, difficulty, GAME.MAX_DIFFICULTY]);

  const handleExit = useCallback(() => {
    dispatch(resetGame());
    navigation.goBack();
  }, [dispatch, navigation]);

  const onContinuePlaying = useCallback(() => {
    dispatch(resetGame());
  }, [dispatch]);

  const handleWatchAd = useCallback(() => {
    Alert.alert('Extra Life', 'Watch an ad to continue playing from your last position.');
  }, []);

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



  useEffect(() => {
    if (gameState === 'loading') {
      dispatch(setDifficulty(1));
      dispatch(setLevelsCompleted(0));
      const initialMaze = generateMaze(1);
      dispatch(setCurrentMaze(initialMaze));
      dispatch(setGameState('playing'));
    }
  }, [gameState, dispatch]);

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
