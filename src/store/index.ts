import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

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
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['maze/setCurrentMaze'],
        ignoredActionPaths: ['payload.maze', 'payload.walls', 'payload.laserGates'],
        ignoredPaths: ['maze.currentMaze', 'maze.walls', 'maze.laserGates'],
      },
    }),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
