import React, { useEffect, useState, useCallback } from 'react';
import { View, Dimensions, BackHandler } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, Surface, Text, Portal, Dialog, IconButton } from 'react-native-paper';
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

import MazeRenderer from '../components/MazeRenderer';
import { GameOverOverlay } from '../components/game/GameOverOverlay';

type GameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type GameState = 'loading' | 'playing' | 'game_over';

const GameScreen: React.FC = () => {
  const { width, height } = Dimensions.get('window');
  const navigation = useNavigation<GameScreenNavigationProp>();
  const { theme, colors } = useTheme();
  const { settings } = useSettings();
  const { updateHighestEndlessLevel } = useMazes();

  const [gameState, setGameState] = useState<GameState>('loading');
  const [currentMaze, setCurrentMaze] = useState<Maze | null>(null);
  const [difficulty, setDifficulty] = useState<number>(1);
  const [levelsCompleted, setLevelsCompleted] = useState<number>(0);
  const [isQuitConfirmVisible, setIsQuitConfirmVisible] = useState(false);

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

  const physics = usePhysics(currentMaze, physicsOptions);

  const ballPosition = physics.getBallPosition();

  const {
    data: gyroData,
    available: gyroscopeAvailable,
    reset: resetGyroscope,
  } = useGyroscope(gameState === 'playing');

  useEffect(() => {
    if (gameState === 'loading') {
       handlePlayAgain();
    }
  }, [gameState, handlePlayAgain]);

  const handlePlayAgain = useCallback(() => {
    physics.reset();
    resetGyroscope();
    setGameState('playing');
  }, [physics, resetGyroscope]);

  const handleGoalReachedAndNextLevel = useCallback(() => {
    if (gameState === 'playing') {
      const completedLevelNumber = difficulty;
      setLevelsCompleted(prev => prev + 1);
      updateHighestEndlessLevel(completedLevelNumber);

      const nextDifficulty = difficulty + 1;
      const nextMaze = generateMaze(nextDifficulty);
      
      setDifficulty(nextDifficulty);
      setCurrentMaze(nextMaze);
      physics.reset();

      setGameState('playing'); 
    }
  }, [
    gameState, 
    difficulty, 
    physics,
    updateHighestEndlessLevel
  ]);

  useEffect(() => {
    if (gameState === 'playing' && gyroscopeAvailable && physics?.update && !physics.isGameOver()) {
      physics.update(gyroData.x, gyroData.y);
    }
  }, [gameState, gyroscopeAvailable, gyroData, physics]);

  useEffect(() => {
    if (gameState === 'playing') {
      if (physics?.isGameOver && physics.isGameOver()) {
        handleGameOver();
      } else if (physics?.isGoalReached && physics.isGoalReached()) {
        handleGoalReachedAndNextLevel();
      }
    }
  }, [gameState, physics, handleGameOver, handleGoalReachedAndNextLevel]);

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

  // Log theme colors for debugging
  useEffect(() => {
    console.log('GameScreen Theme Colors:', JSON.stringify(colors, null, 2));
  }, [colors]);

  if (gameState === 'loading' || !currentMaze || !physics) {
    return (
      <View style={gameScreenStyles.screen}>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={gameScreenStyles.screen}>
      <StatusBar style="auto" />

      <View style={gameScreenStyles.gameContainer}>
        <View style={gameScreenStyles.topBarContainer}>
           <IconButton
             icon="close"
             mode='outlined'
             size={24}
             onPress={showQuitConfirm}
             style={gameScreenStyles.iconButton}
             iconColor={colors?.primary ?? '#6200ee'}
           />

           <Text style={[gameScreenStyles.scoreText, { color: colors?.onSurface ?? '#000000' }]}>
             Score: {levelsCompleted}
           </Text>

           <IconButton
             icon="sync"
             mode='outlined'
             size={24}
             onPress={resetGyroscope}
             style={gameScreenStyles.iconButton}
             iconColor={colors?.primary ?? '#6200ee'}
           />
        </View>

        <Surface
          style={[ gameScreenStyles.mazeSurface, { backgroundColor: theme.surface } ]}
          elevation={4}
        >
          <MazeRenderer
            maze={currentMaze}
            ballPosition={ballPosition}
            ballRadius={7}
            scale={Math.min(width, height) / 440}
          />
        </Surface>
      </View>

      {gameState === 'game_over' && (
        <GameOverOverlay
          score={levelsCompleted}
          bestScore={settings.highestScore ?? 0}
          onPlayAgain={handlePlayAgain}
          onContinueWithAd={() => {
             console.log("Continue with Ad - Not implemented");
             handlePlayAgain();
          }}
        />
      )}

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
    </View>
  );
};

export default GameScreen;
