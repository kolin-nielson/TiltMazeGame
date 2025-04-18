export interface Maze {
  id: string;
  name: string;
  walls: Wall[];
  laserGates?: LaserGate[];
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

export interface LaserGate {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 'horizontal' | 'vertical';
  interval: number; // Time in milliseconds for one complete on/off cycle
  phase: number; // Initial phase offset (0-1)
  onDuration: number; // Percentage of the interval that the laser is on (0-1)
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
  // Material Design 3 base colors
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  surfaceDisabled: string;
  onSurfaceDisabled: string;
  backdrop: string;

  // Game-specific colors
  walls?: string;
  ball?: string;
  goal?: string;
  laser?: string;
}

export type ThemeName = 'light' | 'dark' | 'system';

export interface AppSettings {
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  sensitivity: number;
  highestScore?: number;
  qualityLevel: 'low' | 'medium' | 'high';
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
  highestEndlessLevel?: number;
}
