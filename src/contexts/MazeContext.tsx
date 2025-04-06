import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Maze, UserProgress, LevelStats } from '../types';
import { defaultMazes } from '../utils/defaultMazes';

interface MazeContextType {
  mazes: Maze[];
  userProgress: UserProgress;
  deleteMaze: (id: string) => Promise<boolean>;
  getMaze: (id: string) => Maze | undefined;
  updateProgress: (mazeId: string, time?: number) => Promise<void>;
  resetProgress: () => Promise<void>;
  updateHighestEndlessLevel: (level: number) => Promise<void>;
}

const defaultUserProgress: UserProgress = {
  levels: {},
  totalCompleted: 0,
  customLevelsCreated: 0,
  highestEndlessLevel: 0,
};

const MazeContext = createContext<MazeContextType | undefined>(undefined);

export const MazeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mazes, setMazes] = useState<Maze[]>(defaultMazes);
  const [userProgress, setUserProgress] = useState<UserProgress>(defaultUserProgress);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedMazesStr = await AsyncStorage.getItem('customMazes');
        const storedProgressStr = await AsyncStorage.getItem('userProgress');

        let customMazes: Maze[] = [];
        if (storedMazesStr) {
          customMazes = JSON.parse(storedMazesStr);
        }

        setMazes([...defaultMazes, ...customMazes]);

        let loadedProgress: UserProgress = defaultUserProgress;
        if (storedProgressStr) {
          loadedProgress = JSON.parse(storedProgressStr);
          if (loadedProgress.highestEndlessLevel === undefined) {
            loadedProgress.highestEndlessLevel = 0;
          }
        } else {
          loadedProgress = {
            ...defaultUserProgress,
            levels: defaultMazes.reduce((acc: Record<string, LevelStats>, maze: Maze) => {
              acc[maze.id] = {
                mazeId: maze.id,
                completedCount: 0,
                lastPlayed: undefined,
                bestTime: undefined,
              };
              return acc;
            }, {} as Record<string, LevelStats>),
          };
          await AsyncStorage.setItem('userProgress', JSON.stringify(loadedProgress));
        }
        setUserProgress(loadedProgress);

      } catch (error) {
        console.error('Error loading maze data:', error);
        setUserProgress(defaultUserProgress);
      }
    };

    loadData();
  }, []);

  const saveCustomMazes = async (customMazes: Maze[]) => {
    try {
      await AsyncStorage.setItem(
        'customMazes',
        JSON.stringify(
          customMazes.filter(maze => !defaultMazes.some((dm: Maze) => dm.id === maze.id))
        )
      );
    } catch (error) {
      console.error('Error saving custom mazes:', error);
    }
  };

  const saveUserProgress = async (progress: UserProgress) => {
    try {
      await AsyncStorage.setItem('userProgress', JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving user progress:', error);
    }
  };

  const deleteMaze = async (id: string): Promise<boolean> => {
    if (defaultMazes.some((dm: Maze) => dm.id === id)) {
      console.warn('Cannot delete default maze');
      return false;
    }

    const updatedMazes = mazes.filter(maze => maze.id !== id);
    setMazes(updatedMazes);
    await saveCustomMazes(updatedMazes);

    const { [id]: _, ...remainingLevels } = userProgress.levels;
    const updatedProgress = {
      ...userProgress,
      levels: remainingLevels,
    };
    setUserProgress(updatedProgress);
    await saveUserProgress(updatedProgress);

    return true;
  };

  const getMaze = (id: string): Maze | undefined => {
    return mazes.find(maze => maze.id === id);
  };

  const updateProgress = async (mazeId: string, time?: number): Promise<void> => {
    const maze = getMaze(mazeId);
    if (!maze) return;

    const levelStats = userProgress.levels[mazeId] || {
      mazeId,
      completedCount: 0,
      lastPlayed: undefined,
      bestTime: undefined,
    };

    const updatedStats: LevelStats = {
      ...levelStats,
      completedCount: levelStats.completedCount + 1,
      lastPlayed: Date.now(),
      bestTime: time
        ? levelStats.bestTime
          ? Math.min(levelStats.bestTime, time)
          : time
        : levelStats.bestTime,
    };

    const updatedProgress: UserProgress = {
      ...userProgress,
      totalCompleted: userProgress.totalCompleted + 1,
      levels: {
        ...userProgress.levels,
        [mazeId]: updatedStats,
      },
    };

    setUserProgress(updatedProgress);
    await saveUserProgress(updatedProgress);
  };

  const updateHighestEndlessLevel = async (level: number): Promise<void> => {
    if (level > (userProgress.highestEndlessLevel ?? 0)) {
      const updatedProgress = {
        ...userProgress,
        highestEndlessLevel: level,
      };
      setUserProgress(updatedProgress);
      await saveUserProgress(updatedProgress);
    }
  };

  const resetProgress = async (): Promise<void> => {
    const initialProgress: UserProgress = {
      ...defaultUserProgress,
      levels: mazes.reduce((acc: Record<string, LevelStats>, maze: Maze) => {
        acc[maze.id] = {
          mazeId: maze.id,
          completedCount: 0,
          lastPlayed: undefined,
          bestTime: undefined,
        };
        return acc;
      }, {} as Record<string, LevelStats>),
    };

    setUserProgress(initialProgress);
    await saveUserProgress(initialProgress);
  };

  return (
    <MazeContext.Provider
      value={{
        mazes,
        userProgress,
        deleteMaze,
        getMaze,
        updateProgress,
        resetProgress,
        updateHighestEndlessLevel,
      }}
    >
      {children}
    </MazeContext.Provider>
  );
};

export const useMazes = (): MazeContextType => {
  const context = useContext(MazeContext);
  if (!context) {
    throw new Error('useMazes must be used within a MazeProvider');
  }
  return context;
};
