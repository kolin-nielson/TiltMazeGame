import React, { useEffect, useState, useCallback } from 'react';
import { View, Dimensions, BackHandler } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, Surface } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useSettings } from '../contexts/SettingsContext';
import { useMazes } from '../contexts/MazeContext';
import { useTheme } from '../contexts/ThemeContext';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePhysics } from '../hooks/usePhysics';
import { useGyroscope } from '../hooks/useGyroscope';
import { useGameTimer } from '../hooks/useGameTimer';
import { gameScreenStyles } from '../styles/GameScreenStyles';

import MazeRenderer from '../components/MazeRenderer';
import { GameTimer } from '../components/game/GameTimer';
import { GameReadyOverlay } from '../components/game/GameReadyOverlay';
import { GamePausedOverlay } from '../components/game/GamePausedOverlay';
import { GameCompletedOverlay } from '../components/game/GameCompletedOverlay';
import { GameDebugInfo } from '../components/game/GameDebugInfo';

type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;
type GameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type GameState = 'ready' | 'playing' | 'paused' | 'completed';

const GameScreen: React.FC = () => {
  const { width, height } = Dimensions.get('window');
  const navigation = useNavigation<GameScreenNavigationProp>();
  const route = useRoute<GameScreenRouteProp>();
  const { mazeId } = route.params;
  const { theme } = useTheme();
  const { settings } = useSettings();
  const { mazes, getMaze, updateProgress } = useMazes();

  const [gameState, setGameState] = useState<GameState>('ready');

  const maze = getMaze(mazeId);

  if (!maze) {
    return (
      <View style={gameScreenStyles.screen}>
        <StatusBar style="auto" />
        <Button onPress={() => navigation.goBack()}>Maze Not Found. Go Back</Button>
      </View>
    );
  }

  const physicsOptions = {
    width,
    height,
    gravityScale: 0.012,
    ballRadius: 15,
  };

  const {
    getBallPosition,
    reset: resetPhysics,
    isGoalReached,
    update: updatePhysics,
  } = usePhysics(maze, physicsOptions);

  const ballPosition = getBallPosition();

  const {
    data: gyroData,
    available: gyroscopeAvailable,
    reset: resetGyroscope,
  } = useGyroscope(gameState === 'playing');

  const { elapsed, startTimer, stopTimer, resetTimer, formatTime } = useGameTimer();

  const handleStart = useCallback(() => {
    resetPhysics();
    resetTimer();
    resetGyroscope();
    setGameState('playing');
    startTimer();
  }, [resetPhysics, resetTimer, resetGyroscope, startTimer]);

  const handlePause = useCallback(() => {
    stopTimer();
    setGameState('paused');
  }, [stopTimer]);

  const handleResume = useCallback(() => {
    setGameState('playing');
    startTimer();
  }, [startTimer]);

  const handleRestart = useCallback(() => {
    resetPhysics();
    resetTimer();
    setGameState('ready');
  }, [resetPhysics, resetTimer]);

  const handleGoalReached = useCallback(() => {
    if (gameState === 'playing') {
      stopTimer();
      setGameState('completed');
      updateProgress(mazeId, elapsed);
    }
  }, [gameState, stopTimer, updateProgress, mazeId, elapsed]);

  useEffect(() => {
    if (gameState === 'playing' && gyroscopeAvailable) {
      updatePhysics(gyroData.x, gyroData.y);
    }
  }, [gameState, gyroscopeAvailable, gyroData, updatePhysics]);

  useEffect(() => {
    if (gameState === 'playing' && isGoalReached()) {
      handleGoalReached();
    }
  }, [gameState, isGoalReached, handleGoalReached]);

  useEffect(() => {
    const handleBackPress = () => {
      if (gameState === 'playing') {
        handlePause();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [gameState, handlePause]);

  const handleNextLevel = () => {
    const currentIndex = mazes.findIndex(m => m.id === mazeId);
    if (currentIndex >= 0 && currentIndex < mazes.length - 1) {
      const nextMaze = mazes[currentIndex + 1];
      navigation.replace('Game', { mazeId: nextMaze.id });
    } else {
      navigation.navigate('LevelSelect');
    }
  };

  return (
    <View style={gameScreenStyles.screen}>
      <StatusBar style="auto" />

      <View style={gameScreenStyles.gameContainer}>
        <GameTimer formattedTime={formatTime(elapsed)} />

        <Surface style={gameScreenStyles.mazeSurface} elevation={4}>
          <MazeRenderer
            maze={maze}
            ballPosition={ballPosition}
            ballRadius={15}
            paused={gameState !== 'playing'}
            scale={Math.min(width, height) / 440}
          />
        </Surface>

        {gameState === 'playing' && (
          <Button mode="contained" style={gameScreenStyles.pauseButton} onPress={handlePause}>
            Pause
          </Button>
        )}

        {settings.vibrationEnabled && (
          <GameDebugInfo
            position={ballPosition}
            gyroscopeAvailable={gyroscopeAvailable}
            hapticEnabled={settings.vibrationEnabled}
          />
        )}
      </View>

      {gameState === 'ready' && (
        <GameReadyOverlay
          mazeName={maze.name}
          onStart={handleStart}
          onBack={() => navigation.goBack()}
        />
      )}

      {gameState === 'paused' && (
        <GamePausedOverlay
          onResume={handleResume}
          onRestart={handleRestart}
          onExit={() => navigation.goBack()}
        />
      )}

      {gameState === 'completed' && (
        <GameCompletedOverlay
          elapsedTime={formatTime(elapsed)}
          onNextLevel={handleNextLevel}
          onRestart={handleRestart}
          onExit={() => navigation.goBack()}
        />
      )}
    </View>
  );
};

export default GameScreen;
