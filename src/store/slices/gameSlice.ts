import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type GameState = 'loading' | 'ready' | 'playing' | 'paused' | 'game_over' | 'completed';

interface GameStateInterface {
  gameState: GameState;
  difficulty: number;
  levelsCompleted: number;
  goalReached: boolean;
  gameOver: boolean;
  showCalibrationOverlay: boolean;
  showLevelTransition: boolean;
  showDeathAnimation: boolean;
  deathPosition: { x: number; y: number };
  gyroscopeCalibrated: boolean;
  isManualRecalibrating: boolean;
}

const initialState: GameStateInterface = {
  gameState: 'loading',
  difficulty: 1,
  levelsCompleted: 0,
  goalReached: false,
  gameOver: false,
  showCalibrationOverlay: false,
  showLevelTransition: false,
  showDeathAnimation: false,
  deathPosition: { x: 0, y: 0 },
  gyroscopeCalibrated: false,
  isManualRecalibrating: false,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGameState: (state, action: PayloadAction<GameState>) => {
      state.gameState = action.payload;
    },
    setDifficulty: (state, action: PayloadAction<number>) => {
      state.difficulty = action.payload;
    },
    incrementLevelsCompleted: (state) => {
      state.levelsCompleted += 1;
    },
    setLevelsCompleted: (state, action: PayloadAction<number>) => {
      state.levelsCompleted = action.payload;
    },
    setGoalReached: (state, action: PayloadAction<boolean>) => {
      state.goalReached = action.payload;
    },
    setGameOver: (state, action: PayloadAction<boolean>) => {
      state.gameOver = action.payload;
    },
    setShowCalibrationOverlay: (state, action: PayloadAction<boolean>) => {
      state.showCalibrationOverlay = action.payload;
    },
    setShowLevelTransition: (state, action: PayloadAction<boolean>) => {
      state.showLevelTransition = action.payload;
    },
    setShowDeathAnimation: (state, action: PayloadAction<boolean>) => {
      state.showDeathAnimation = action.payload;
    },
    setDeathPosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.deathPosition = action.payload;
    },
    setGyroscopeCalibrated: (state, action: PayloadAction<boolean>) => {
      state.gyroscopeCalibrated = action.payload;
    },
    setIsManualRecalibrating: (state, action: PayloadAction<boolean>) => {
      state.isManualRecalibrating = action.payload;
    },
    resetGame: (state) => {
      state.gameState = 'loading';
      state.difficulty = 1;
      state.levelsCompleted = 0;
      state.goalReached = false;
      state.gameOver = false;
      state.showLevelTransition = false;
      state.showDeathAnimation = false;
    },
  },
});

export const {
  setGameState,
  setDifficulty,
  incrementLevelsCompleted,
  setLevelsCompleted,
  setGoalReached,
  setGameOver,
  setShowCalibrationOverlay,
  setShowLevelTransition,
  setShowDeathAnimation,
  setDeathPosition,
  setGyroscopeCalibrated,
  setIsManualRecalibrating,
  resetGame,
} = gameSlice.actions;
export default gameSlice.reducer;
