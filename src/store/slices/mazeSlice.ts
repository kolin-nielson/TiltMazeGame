import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { Maze, Wall, LaserGate } from '@types';
import { generateMaze } from '@utils/mazeGenerator';

export interface MazeState {
  currentMaze: Maze | null;
  highestEndlessLevel: number;
  completedMazes: string[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: MazeState = {
  currentMaze: null,
  highestEndlessLevel: 0,
  completedMazes: [],
  status: 'idle',
  error: null,
};

export const loadMazeProgress = createAsyncThunk(
  'maze/loadMazeProgress',
  async (_, { rejectWithValue }) => {
    try {
      const progressJson = await AsyncStorage.getItem('mazeProgress');
      if (progressJson) {
        return JSON.parse(progressJson);
      }
      return { highestEndlessLevel: 0, completedMazes: [] };
    } catch (error) {
      return rejectWithValue('Failed to load maze progress');
    }
  }
);

export const saveMazeProgress = createAsyncThunk(
  'maze/saveMazeProgress',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { maze: MazeState };
      const { highestEndlessLevel, completedMazes } = state.maze;

      await AsyncStorage.setItem(
        'mazeProgress',
        JSON.stringify({ highestEndlessLevel, completedMazes })
      );

      return { highestEndlessLevel, completedMazes };
    } catch (error) {
      return rejectWithValue('Failed to save maze progress');
    }
  }
);

export const resetMazeProgress = createAsyncThunk(
  'maze/resetMazeProgress',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem('mazeProgress');
      return { highestEndlessLevel: 0, completedMazes: [] };
    } catch (error) {
      return rejectWithValue('Failed to reset maze progress');
    }
  }
);

const mazeSlice = createSlice({
  name: 'maze',
  initialState,
  reducers: {
    setCurrentMaze: (state, action: PayloadAction<Maze | null>) => {
      state.currentMaze = action.payload;
    },
    generateNewMaze: (state, action: PayloadAction<number>) => {
      state.currentMaze = generateMaze(action.payload);
    },
    updateHighestEndlessLevel: (state, action: PayloadAction<number>) => {
      if (action.payload > state.highestEndlessLevel) {
        state.highestEndlessLevel = action.payload;
      }
    },
    addCompletedMaze: (state, action: PayloadAction<string>) => {
      if (!state.completedMazes.includes(action.payload)) {
        state.completedMazes.push(action.payload);
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadMazeProgress.pending, state => {
        state.status = 'loading';
      })
      .addCase(loadMazeProgress.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload) {
          state.highestEndlessLevel = action.payload.highestEndlessLevel || 0;
          state.completedMazes = action.payload.completedMazes || [];
        }
      })
      .addCase(loadMazeProgress.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(saveMazeProgress.fulfilled, (state, action) => {})
      .addCase(resetMazeProgress.fulfilled, state => {
        state.highestEndlessLevel = 0;
        state.completedMazes = [];
      });
  },
});

export const { setCurrentMaze, generateNewMaze, updateHighestEndlessLevel, addCompletedMaze } =
  mazeSlice.actions;
export default mazeSlice.reducer;
