import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import reducers
import settingsReducer from './slices/settingsSlice';
import mazeReducer from './slices/mazeSlice';
import gameReducer from './slices/gameSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    maze: mazeReducer,
    game: gameReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['maze/setCurrentMaze'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.maze', 'payload.walls', 'payload.laserGates'],
        // Ignore these paths in the state
        ignoredPaths: ['maze.currentMaze', 'maze.walls', 'maze.laserGates'],
      },
    }),
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
