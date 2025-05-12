import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk } from '@reduxjs/toolkit';
export interface SettingsState {
  sensitivity: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  highestScore: number;
  qualityLevel: 'low' | 'medium' | 'high';
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  hasSeenTutorial: boolean;
}
const initialState: SettingsState = {
  sensitivity: 1.0,
  soundEnabled: true,
  vibrationEnabled: true,
  highestScore: 0,
  qualityLevel: 'high',
  status: 'idle',
  error: null,
  hasSeenTutorial: false,
};
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async (_, { rejectWithValue }) => {
    try {
      const settingsJson = await AsyncStorage.getItem('settings');
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      return initialState;
    } catch (error) {
      return rejectWithValue('Failed to load settings');
    }
  }
);
export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (settings: Partial<SettingsState>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { settings: SettingsState };
      const updatedSettings = { ...state.settings, ...settings };
      const { status, error, ...settingsToSave } = updatedSettings;
      await AsyncStorage.setItem('settings', JSON.stringify(settingsToSave));
      return settings;
    } catch (error) {
      return rejectWithValue('Failed to save settings');
    }
  }
);
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return { ...state, ...action.payload };
    },
    resetSettings: () => initialState,
    setHasSeenTutorial: (state, action: PayloadAction<boolean>) => {
      state.hasSeenTutorial = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadSettings.pending, state => {
        state.status = 'loading';
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        Object.assign(state, action.payload);
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
      });
  },
});
export const { updateSettings, resetSettings, setHasSeenTutorial } = settingsSlice.actions;
export default settingsSlice.reducer;
