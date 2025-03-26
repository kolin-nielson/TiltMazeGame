export interface Maze {
  id: string;
  name: string;
  walls: Wall[];
  startPosition: Position;
  endPosition: Position;
  createdAt: number;
  updatedAt: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Ball {
  position: Position;
  radius: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  error: string;
  success: string;
  walls: string;
  ball: string;
  goal: string;
}

export type ThemeName = 'light' | 'dark' | 'blue' | 'custom';

export interface AppSettings {
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  theme: ThemeName;
  customTheme?: ThemeColors;
  sensitivity: number;
}

export interface LevelStats {
  mazeId: string;
  bestTime?: number;
  completedCount: number;
  lastPlayed?: number;
}

export interface UserProgress {
  levels: Record<string, LevelStats>;
  totalCompleted: number;
  customLevelsCreated: number;
}
