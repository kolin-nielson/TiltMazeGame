import { useState, useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useGameTimer } from './useGameTimer';
import { useMazes } from '../contexts/MazeContext';

export type GameState = 'ready' | 'playing' | 'paused' | 'completed';

interface UseGameStateProps {
  mazeId: string;
  onReset: () => void;
  isGoalReached: () => boolean;
}

interface UseGameStateReturn {
  gameState: GameState;
  elapsed: number;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  formatTime: (time: number) => string;
  handleGoalCheck: () => void;
}

export const useGameState = ({
  mazeId,
  onReset,
  isGoalReached,
}: UseGameStateProps): UseGameStateReturn => {
  const [gameState, setGameState] = useState<GameState>('ready');
  const { updateProgress } = useMazes();
  const { elapsed, startTimer, stopTimer, resetTimer, formatTime } = useGameTimer();

  const handleGoalCheck = useCallback(() => {
    if (gameState === 'playing' && isGoalReached()) {
      stopTimer();
      setGameState('completed');
      updateProgress(mazeId, elapsed);
    }
  }, [gameState, isGoalReached, stopTimer, updateProgress, mazeId, elapsed]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (gameState === 'playing') {
          pauseGame();
          return true;
        }
        return false;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [gameState])
  );

  const startGame = useCallback(() => {
    onReset();
    resetTimer();
    setGameState('playing');
    startTimer();
  }, [onReset, resetTimer, startTimer]);

  const pauseGame = useCallback(() => {
    stopTimer();
    setGameState('paused');
  }, [stopTimer]);

  const resumeGame = useCallback(() => {
    setGameState('playing');
    startTimer();
  }, [startTimer]);

  const restartGame = useCallback(() => {
    onReset();
    resetTimer();
    setGameState('ready');
  }, [onReset, resetTimer]);

  return {
    gameState,
    elapsed,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    formatTime,
    handleGoalCheck,
  };
};
