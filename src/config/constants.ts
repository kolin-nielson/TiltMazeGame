export const APP_NAME = 'Tilt Maze';
export const APP_VERSION = '1.0.0';
export const PHYSICS = {
  GRAVITY_SCALE: 0.001,
  MAX_VELOCITY: 2.5,
  BALL_DENSITY: 0.15,
  WALL_FRICTION: 0.1,
  COLLISION_FILTER: {
    WALL: 0x0001,
    BALL: 0x0002,
  },
};
export const STORAGE_KEYS = {
  USER_PROGRESS: 'user_progress',
  CUSTOM_THEME: 'custom_theme',
  SETTINGS: 'app_settings',
  HIGH_SCORES: 'high_scores',
  COMPLETED_LEVELS: 'completed_levels',
};
export const ANIMATION = {
  FADE_IN: 300,
  FADE_OUT: 250,
  SLIDE: 400,
  BOUNCE: 800,
};
export const SCREENS = {
  HOME: 'Home',
  LEVEL_SELECT: 'LevelSelect',
  GAME: 'Game',
  SETTINGS: 'Settings',
  THEME: 'Theme',
  ABOUT: 'About',
  STATS: 'Stats',
};
export const GAME = {
  INITIAL_LIVES: 3,
  POINTS_PER_COIN: 1,
  COINS_PER_LEVEL: 8,
  MAX_DIFFICULTY: 50,
  MAZE_AREA_SIZE: 300,
  CELL_SIZE: 20,
};
export const DEFAULT_SETTINGS = {
  soundEnabled: true,
  vibrationEnabled: true,
  showTimer: true,
  difficulty: 'medium',
};
