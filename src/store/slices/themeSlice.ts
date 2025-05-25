import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { ThemeColors } from '@types';
import { lightTheme, darkTheme } from '@styles/themes';
export type ThemeName = 'light' | 'dark' | 'system';
export interface ThemeState {
  themeName: ThemeName;
  isDark: boolean;
  colors: ThemeColors;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}
const initialState: ThemeState = {
  themeName: 'light',
  isDark: false,
  colors: lightTheme,
  status: 'idle',
  error: null,
};
export const loadTheme = createAsyncThunk('theme/loadTheme', async (_, { rejectWithValue }) => {
  try {
    const themeJson = await AsyncStorage.getItem('theme');
    if (themeJson) {
      const savedTheme = JSON.parse(themeJson);
      return savedTheme;
    }
    return { themeName: 'light' };
  } catch (error) {
    return rejectWithValue('Failed to load theme');
  }
});
export const saveTheme = createAsyncThunk(
  'theme/saveTheme',
  async (themeName: ThemeName, { rejectWithValue }) => {
    try {
      await AsyncStorage.setItem('theme', JSON.stringify({ themeName }));
      return { themeName };
    } catch (error) {
      return rejectWithValue('Failed to save theme');
    }
  }
);
const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeName>) => {
      state.themeName = action.payload;
    },
    setIsDark: (state, action: PayloadAction<boolean>) => {
      state.isDark = action.payload;
      state.colors = action.payload ? darkTheme : lightTheme;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadTheme.pending, state => {
        state.status = 'loading';
      })
      .addCase(loadTheme.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload && action.payload.themeName) {
          state.themeName = action.payload.themeName;
        }
      })
      .addCase(loadTheme.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(saveTheme.fulfilled, (state, action) => {
        if (action.payload && action.payload.themeName) {
          state.themeName = action.payload.themeName;
        }
      });
  },
});
export const { setTheme, setIsDark } = themeSlice.actions;
export default themeSlice.reducer;
