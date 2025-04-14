import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Dimensions, BackHandler } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, Surface, Text, Portal, Dialog, IconButton, Appbar, Snackbar } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMazes } from '../contexts/MazeContext';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePhysics } from '../hooks/usePhysics';
import { useGyroscope } from '../hooks/useGyroscope';
import { gameScreenStyles } from '../styles/GameScreenStyles';
import { generateMaze } from '../utils/mazeGenerator';
import { Maze } from '../types';
import { GAME } from '../config/constants';
import * as Haptics from 'expo-haptics';

import MazeRenderer from '../components/MazeRenderer';
import { GameOverOverlay } from '../components/game/GameOverOverlay';

type GameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type GameState = 'loading' | 'playing' | 'game_over';

const GameScreen: React.FC = () => {
  const { width, height } = Dimensions.get('window');
  const navigation = useNavigation<GameScreenNavigationProp>();
  const { theme, colors, isDark } = useTheme();
  const { settings } = useSettings();
  const { updateHighestEndlessLevel } = useMazes();

  const [gameState, setGameState] = useState<GameState>('loading');
  const [currentMaze, setCurrentMaze] = useState<Maze | null>(null);
  const [difficulty, setDifficulty] = useState<number>(1);
  const [levelsCompleted, setLevelsCompleted] = useState<number>(0);
  const [isQuitConfirmVisible, setIsQuitConfirmVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [gyroscopeCalibrated, setGyroscopeCalibrated] = useState(false);
  const [isManualRecalibrating, setIsManualRecalibrating] = useState(false);
  const recalibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (difficulty === 1) {
       const initialMaze = generateMaze(difficulty);
       setCurrentMaze(initialMaze);
    }
  }, [difficulty]);

  const physicsOptions = {
    width,
    height,
    gravityScale: 0.015,
    ballRadius: 7,
  };

  const {
    ballPositionX,
    ballPositionY,
    update,
    reset: resetPhysics,
    goalReached,
    gameOver
  } = usePhysics(currentMaze, physicsOptions);

  // Always keep the gyroscope enabled to maintain calibration
  // We'll just ignore the data when not playing
  const {
    data: gyroData,
    available: gyroscopeAvailable,
    reset: resetGyroscope,
    isCalibrated: gyroIsCalibrated,
    hasDeviceMovedSignificantly,
  } = useGyroscope(true);

  // Initialize the game when it first loads
  useEffect(() => {
    if (gameState === 'loading') {
       console.log('Game loading, initializing...');
       handlePlayAgain();
    }
  }, [gameState, handlePlayAgain]);

  // Make sure gyroscope is calibrated when the game starts playing
  useEffect(() => {
    if (gameState === 'playing' && !gyroIsCalibrated && gyroscopeAvailable) {
      console.log('Game started playing, calibrating gyroscope...');
      resetGyroscope();
      setGyroscopeCalibrated(true);
    } else if (gyroIsCalibrated && !gyroscopeCalibrated) {
      // Sync our local state with the global state
      console.log('Syncing gyroscope calibration state...');
      setGyroscopeCalibrated(true);
    }
  }, [gameState, gyroscopeCalibrated, gyroIsCalibrated, gyroscopeAvailable, resetGyroscope]);

  const handlePlayAgain = useCallback(() => {
    if (resetPhysics) {
      resetPhysics();
    }

    setDifficulty(1);
    setLevelsCompleted(0);
    const initialMaze = generateMaze(1);
    setCurrentMaze(initialMaze);
    setGameState('playing');
  }, [resetPhysics]);

  const handleGoalReachedAndNextLevel = useCallback(() => {
    if (gameState === 'playing') {
      console.log('[Goal Reached] Start handling next level...');

      // CRITICAL: We must NOT reset the gyroscope calibration between levels
      // This is what causes the user to have to tilt their device more and more

      // Reset physics FIRST to set goalReached to false
      console.log('[Goal Reached] Calling resetPhysics...');
      if (resetPhysics) {
          resetPhysics();
      }
      console.log('[Goal Reached] resetPhysics complete.');

      // Log the current calibration state
      console.log('[Goal Reached] Gyroscope calibration preserved:', gyroIsCalibrated ? 'YES' : 'NO');
      console.log('[Goal Reached] Device moved significantly:', hasDeviceMovedSignificantly() ? 'YES' : 'NO');

      const completedLevelNumber = difficulty;
      setLevelsCompleted(prev => prev + 1);
      updateHighestEndlessLevel(completedLevelNumber);

      // Cap difficulty at maximum level (4)
      const nextDifficulty = Math.min(difficulty + 1, GAME.MAX_DIFFICULTY);
      console.log(`[Goal Reached] Generating maze for difficulty: ${nextDifficulty}`);
      const nextMaze = generateMaze(nextDifficulty);
      console.log('[Goal Reached] Maze generation complete.');

      // Set new maze and difficulty AFTER resetting physics
      setDifficulty(nextDifficulty);
      setCurrentMaze(nextMaze);

      setGameState('playing');
      console.log('[Goal Reached] Finished handling next level.');
    }
  }, [
    gameState,
    difficulty,
    resetPhysics,
    updateHighestEndlessLevel,
    gyroIsCalibrated,
    hasDeviceMovedSignificantly
  ]);

  // Effect to apply gyroscope data to physics
  useEffect(() => {
    if (gameState === 'playing' && gyroscopeAvailable && update) {
      // Apply the calibrated gyroscope data to the physics engine
      update(gyroData.x, gyroData.y);
    } else if (gameState !== 'playing' && update) {
      // When not playing, set gravity to zero to stop ball movement
      update(0, 0);
    }
    // Dependencies: only what's needed to apply updates
  }, [gameState, gyroscopeAvailable, update, gyroData]);

  // Effect to handle automatic recalibration based on movement
  useEffect(() => {
    if (
      gameState === 'playing' &&
      gyroscopeAvailable &&
      !isManualRecalibrating &&
      gyroIsCalibrated &&
      hasDeviceMovedSignificantly()
    ) {
      console.log('Device moved significantly since calibration, recalibrating...');
      resetGyroscope();
    }
    // Dependencies: only what's needed for the recalibration check
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Rationale: We only want this effect to run on actual state changes (gameState, gameOver, goalReached),
    // not when the handler function reference changes due to its own dependencies (like difficulty).
  }, [gameState, gameOver, goalReached, handleGameOver]);

  useEffect(() => {
    const handleBackPress = () => {
      if (gameState === 'playing') {
        // Do nothing and prevent default back action while playing
        return true;
      }
      // Allow back navigation only if game is over or still loading
      // If loading, back might go to home. If game over, back goes to home.
      // Returning false allows the default system behavior (usually exit screen)
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => subscription.remove();
    // Dependencies: only gameState affects the logic now
  }, [gameState]);

  const handleGameOver = useCallback(() => {
    setGameState('game_over');
  }, []);

  const handleExit = () => {
    navigation.goBack();
  };

  const showQuitConfirm = () => setIsQuitConfirmVisible(true);
  const hideQuitConfirm = () => setIsQuitConfirmVisible(false);

  const handleQuitConfirm = () => {
    hideQuitConfirm();
    handleGameOver();
    navigation.goBack();
  };

  // This function allows the user to manually recalibrate the gyroscope during gameplay
  // by pressing the compass button in the app bar
  const handleResetTilt = useCallback(() => {
    // Clear any existing timeout
    if (recalibrationTimeoutRef.current) {
      clearTimeout(recalibrationTimeoutRef.current);
    }

    setIsManualRecalibrating(true); // Set flag before reset
    resetGyroscope(); // Explicitly reset calibration when user requests it
    setGyroscopeCalibrated(true); // Mark as calibrated
    if (settings.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSnackbarVisible(true);

    // Reset the flag after a short delay
    recalibrationTimeoutRef.current = setTimeout(() => {
      setIsManualRecalibrating(false);
      console.log("Manual recalibration debounce finished.");
    }, 500); // 500ms delay

  }, [resetGyroscope, settings.vibrationEnabled]);

  // Log theme colors for debugging
  useEffect(() => {
    console.log('GameScreen Theme Colors:', JSON.stringify(colors, null, 2));
  }, [colors]);

  // Clear timeout on unmount
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
            onContinueWithAd={() => {
               console.log("Continue with Ad - Not implemented");
               handlePlayAgain();
            }}
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
    </View>
  );
};

export default GameScreen;
