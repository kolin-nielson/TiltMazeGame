import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Dimensions, BackHandler } from 'react-native';
import { Button, Surface, Text, Portal, Dialog, Appbar, Snackbar } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMazes } from '../contexts/MazeContext';
import { usePhysics } from '../hooks/usePhysics';
import { useGyroscope } from '../hooks/useGyroscope';

import { RootStackParamList } from '../navigation/AppNavigator';
import { gameScreenStyles } from '../styles/GameScreenStyles';
import { generateMaze } from '../utils/mazeGenerator';
import { Maze } from '../types';
import { GAME } from '../config/constants';

import MazeRenderer from '../components/MazeRenderer';
import { GameOverOverlay } from '../components/game/GameOverOverlay';
import TiltCalibrationOverlay from '../components/game/TiltCalibrationOverlay';

type GameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type GameState = 'loading' | 'playing' | 'game_over';

const GameScreen: React.FC = () => {
  const { width, height } = Dimensions.get('window');
  const navigation = useNavigation<GameScreenNavigationProp>();
  const { colors, isDark } = useTheme();
  const { settings } = useSettings();
  const { updateHighestEndlessLevel } = useMazes();
  const { updateSettings } = useSettings();

  const [gameState, setGameState] = useState<GameState>('loading');
  const [currentMaze, setCurrentMaze] = useState<Maze | null>(null);
  const [difficulty, setDifficulty] = useState<number>(1);
  const [levelsCompleted, setLevelsCompleted] = useState<number>(0);
  const [isQuitConfirmVisible, setIsQuitConfirmVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [gyroscopeCalibrated, setGyroscopeCalibrated] = useState(false);
  const [isManualRecalibrating, setIsManualRecalibrating] = useState(false);
  const [showCalibrationOverlay, setShowCalibrationOverlay] = useState(false);
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
    setGameState('loading');

    setTimeout(() => {
      if (resetPhysics) {
        resetPhysics();
      }

      setDifficulty(1);
      setLevelsCompleted(0);

      const initialMaze = generateMaze(1);

      setCurrentMaze(initialMaze);
      setGameState('playing');
    }, 100);
  }, [resetPhysics]);

  const handleGoalReachedAndNextLevel = useCallback(() => {
    if (gameState === 'playing') {
      if (resetPhysics) {
        resetPhysics();
      }

      const completedLevelNumber = difficulty;
      const newLevelCount = levelsCompleted + 1;
      setLevelsCompleted(newLevelCount);
      updateHighestEndlessLevel(completedLevelNumber);

      if (newLevelCount > (settings.highestScore || 0)) {
        updateSettings({ highestScore: newLevelCount });
      }

      const nextDifficulty = Math.min(difficulty + 1, GAME.MAX_DIFFICULTY);
      const nextMaze = generateMaze(nextDifficulty);

      setDifficulty(nextDifficulty);
      setCurrentMaze(nextMaze);

      setGameState('playing');
    }
  }, [
    gameState,
    difficulty,
    resetPhysics,
    updateHighestEndlessLevel,
    levelsCompleted,
    settings.highestScore,
    updateSettings
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
      updateSettings({ highestScore: levelsCompleted });
    }
    setGameState('game_over');
  }, [levelsCompleted, settings.highestScore, updateSettings]);

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

    setIsManualRecalibrating(true);
    setShowCalibrationOverlay(true);
  }, []);

  const handleCalibrationComplete = useCallback(() => {
    resetGyroscope();
    setGyroscopeCalibrated(true);
    setShowCalibrationOverlay(false);

    if (settings.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSnackbarVisible(true);

    recalibrationTimeoutRef.current = setTimeout(() => {
      setIsManualRecalibrating(false);
    }, 500);
  }, [resetGyroscope, settings.vibrationEnabled]);

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

      <Appbar.Header
         style={{ backgroundColor: colors?.surface ?? '#fff' }}
         mode="center-aligned"
      >
        <Appbar.Action
            icon="close"
            onPress={showQuitConfirm}
            color={colors?.primary ?? '#6200ee'}
            size={24}
        />
        <Appbar.Content
            title={`Score: ${levelsCompleted}`}
            titleStyle={[gameScreenStyles.appbarTitle, { color: colors?.onSurface ?? '#000'}]}
        />
        <Appbar.Action
            icon="compass-outline"
            onPress={handleResetTilt}
            color={colors?.primary ?? '#6200ee'}
            size={24}
        />
      </Appbar.Header>

      <View style={gameScreenStyles.gameContainer}>
        <Surface
          style={[ gameScreenStyles.mazeSurface, { backgroundColor: colors?.surface ?? '#fff' } ]}
          elevation={4}
        >
          <MazeRenderer
            maze={currentMaze}
            ballPositionX={ballPositionX}
            ballPositionY={ballPositionY}
            ballRadius={7}
            colors={colors}
            gameState={gameState}
          />
        </Surface>
      </View>

      <Portal>
        <Dialog visible={isQuitConfirmVisible} onDismiss={hideQuitConfirm}>
          <Dialog.Title
             style={{ color: colors?.onSurface ?? '#000' }}
          >
             Quit Game?
          </Dialog.Title>
          <Dialog.Content>
            <Text
              variant="bodyMedium"
              style={{ color: colors?.onSurfaceVariant ?? '#444' }}
            >
              Are you sure you want to quit? Your current score will be lost if it's not your best.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={hideQuitConfirm}
              textColor={colors?.primary ?? '#6200ee'}
            >
              Cancel
            </Button>
            <Button
              onPress={handleQuitConfirm}
              textColor={colors?.error ?? '#B00020'}
            >
              Quit
            </Button>
          </Dialog.Actions>
        </Dialog>
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
    </View>
  );
};

export default GameScreen;
