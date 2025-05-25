import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, BackHandler, Alert, AppState, AppStateStatus } from 'react-native';
import { Text, Snackbar, Portal } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { GameScreenNavigationProp } from '@navigation/types';
import * as Haptics from 'expo-haptics';
import { useGyroscope } from '@hooks/useGyroscope';
import Slider from '@react-native-community/slider';
import Animated from 'react-native-reanimated';
import { useAppSelector, useAppDispatch, RootState } from '@store';
import { updateSettings, saveSettings } from '@store/slices/settingsSlice';
import {
  updateHighestEndlessLevel,
  saveMazeProgress,
  setCurrentMaze,
} from '@store/slices/mazeSlice';
import {
  setGameState,
  setDifficulty,
  setLevelsCompleted,
  setShowCalibrationOverlay,
  setShowLevelTransition,
  setShowDeathAnimation,
  setDeathPosition,
  setGyroscopeCalibrated,
  setIsManualRecalibrating,
  setGameOver,
  resetGame,
  continueAfterAd,
} from '@store/slices/gameSlice';
import { usePhysics } from '@hooks/usePhysics';
import { collectCoinAndSave } from '@store/slices/shopSlice';
import { showRewardedAd } from '../services/adsService';
import { gameScreenStyles } from '@styles/GameScreenStyles';
import { generateMaze } from '@utils/mazeGenerator';
import { GAME } from '@config/constants';
import { GameOverOverlay } from '@components/game/GameOverOverlay';
import TiltCalibrationOverlay from '@components/game/TiltCalibrationOverlay';
import LevelTransition from '@components/game/LevelTransition';
import SimpleDeathScreen from '@components/game/SimpleDeathScreen';
import GameHeader from '@components/game/GameHeader';
import QuitConfirmDialog from '@components/game/QuitConfirmDialog';
import MazeView from '@components/game/MazeView';
type GameState = 'loading' | 'playing' | 'game_over';
type PhysicsMazeProps = {
  maze: Maze;
  gyroX: number;
  gyroY: number;
  gameState: GameState;
  isTransitioning: boolean;
  isDying: boolean;
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  update: (gyroX: number, gyroY: number, resetVelocity?: boolean) => void;
  colors: any;
  ballRadius: number;
};
const PhysicsMaze: React.FC<PhysicsMazeProps> = ({
  maze,
  gyroX,
  gyroY,
  gameState,
  isTransitioning,
  isDying,
  ballPositionX,
  ballPositionY,
  update,
  colors,
  ballRadius,
}) => {
  const prevGameStateRef = useRef<GameState | null>(null);
  const isFirstFrameRef = useRef(true);
  useEffect(() => {
    const wasNotPlaying = prevGameStateRef.current !== 'playing';
    const isNowPlaying = gameState === 'playing';
    const justStartedPlaying = wasNotPlaying && isNowPlaying && !isTransitioning && !isDying;
    prevGameStateRef.current = gameState;
    const frozen = isTransitioning || isDying || gameState !== 'playing';
    let effectiveX = 0;
    let effectiveY = 0;
    if (!frozen && !isFirstFrameRef.current) {
      effectiveX = gyroX;
      effectiveY = gyroY;
    }
    const shouldResetVelocity = justStartedPlaying || isFirstFrameRef.current;
    const frameId = requestAnimationFrame(() => {
      update(effectiveX, effectiveY, shouldResetVelocity);
      if (isFirstFrameRef.current) {
        isFirstFrameRef.current = false;
      }
    });
    return () => cancelAnimationFrame(frameId);
  }, [gyroX, gyroY, gameState, isTransitioning, isDying, update]);
  return (
    <View style={gameScreenStyles.mazeContainer}>
      <View style={gameScreenStyles.mazeSurface}>
        <MazeView
          maze={maze}
          ballPositionX={ballPositionX}
          ballPositionY={ballPositionY}
          ballRadius={ballRadius}
          colors={colors}
          gameState={gameState}
        />
      </View>
    </View>
  );
};
const GameScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<GameScreenNavigationProp>();
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  const isDark = useAppSelector((state: RootState) => state.theme.isDark);
  const settings = useAppSelector((state: RootState) => state.settings);
  const gameState = useAppSelector((state: RootState) => state.game.gameState) as GameState;
  const currentMaze = useAppSelector((state: RootState) => state.maze.currentMaze);
  const difficulty = useAppSelector((state: RootState) => state.game.difficulty);
  const levelsCompleted = useAppSelector((state: RootState) => state.game.levelsCompleted);
  const gyroscopeCalibrated = useAppSelector((state: RootState) => state.game.gyroscopeCalibrated);
  const isManualRecalibrating = useAppSelector(
    (state: RootState) => state.game.isManualRecalibrating
  );
  const showCalibrationOverlay = useAppSelector(
    (state: RootState) => state.game.showCalibrationOverlay
  );
  const showLevelTransition = useAppSelector((state: RootState) => state.game.showLevelTransition);
  const showDeathAnimation = useAppSelector((state: RootState) => state.game.showDeathAnimation);
  
  // Track app state for handling background/foreground transitions
  const [appState, setAppState] = useState(AppState.currentState);
  const prevAppStateRef = useRef<AppStateStatus>(AppState.currentState);
  const wasPlayingBeforeBackgroundRef = useRef<boolean>(false);
  const [isQuitConfirmVisible, setIsQuitConfirmVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const recalibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [sliderValue, setSliderValue] = useState<number>(settings.sensitivity);
  const [isSliding, setIsSliding] = useState<boolean>(false);
  useEffect(() => {
    if (!isSliding) {
      setSliderValue(settings.sensitivity);
    }
  }, [settings.sensitivity, isSliding]);
  const handleSensitivityChange = useCallback((value: number) => {
    setSliderValue(value);
  }, []);
  const handleSlidingStart = useCallback(() => {
    setIsSliding(true);
  }, []);
  const handleSlidingComplete = useCallback(
    (value: number) => {
      setIsSliding(false);
      dispatch(updateSettings({ sensitivity: value }));
      dispatch(saveSettings({ sensitivity: value }));
    },
    [dispatch]
  );
  const physicsOptions = {
    width: 300,
    height: 300,
    gravityScale: 0.015,
    ballRadius: 7,
    vibrationEnabled: settings.vibrationEnabled,
    sensitivity: sliderValue,
  };
  const {
    data: gyroData,
    available: gyroscopeAvailable,
    reset: resetGyroscope,
    forceCalibration: forceGyroscopeCalibration,
    isCalibrated: gyroIsCalibrated,
    isCalibrating: gyroIsCalibrating,
    hasDeviceMovedSignificantly,
  } = useGyroscope(true);
  const { ballPositionX, ballPositionY, update, goalReached, gameOver, reset: resetPhysics } = usePhysics(currentMaze, physicsOptions);
  const handlePlayAgain = useCallback(() => {
    isFirstLevelRef.current = true;
    dispatch(resetGame());
    resetPhysics();
  }, [dispatch, resetPhysics]);
  const handleGameOver = useCallback(() => {
    if (levelsCompleted > (settings.highestScore || 0)) {
      dispatch(updateSettings({ highestScore: levelsCompleted }));
      dispatch(saveSettings({ highestScore: levelsCompleted }));
    }
    if (settings.vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }, 150);
    }
    dispatch(setShowDeathAnimation(true));
    resetPhysics();
  }, [dispatch, levelsCompleted, settings.highestScore, settings.vibrationEnabled, resetPhysics]);
  const prevGameStateForCalibrationRef = useRef<GameState | null>(null);
  useEffect(() => {
    const wasNotPlaying = prevGameStateForCalibrationRef.current !== 'playing';
    const isNowPlaying = gameState === 'playing';
    const justStartedPlaying = wasNotPlaying && isNowPlaying;
    prevGameStateForCalibrationRef.current = gameState;
    if (justStartedPlaying && gyroscopeAvailable) {
      setTimeout(() => {
        resetGyroscope();
        dispatch(setGyroscopeCalibrated(true));
        if (settings.vibrationEnabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }, 100); 
    }
  }, [gameState, gyroscopeAvailable, resetGyroscope, dispatch, settings.vibrationEnabled]);
  useEffect(() => {
    if (gameState === 'playing' && !gyroIsCalibrated && gyroscopeAvailable) {
      resetGyroscope();
      dispatch(setGyroscopeCalibrated(true));
    } else if (gyroIsCalibrated && !gyroscopeCalibrated) {
      dispatch(setGyroscopeCalibrated(true));
    }
  }, [gameState, gyroscopeCalibrated, gyroIsCalibrated, gyroscopeAvailable, resetGyroscope, dispatch]);
  const handleGoalReachedAndNextLevel = useCallback(() => {
    if (gameState === 'playing') {
      const completedLevelNumber = difficulty;
      const newLevelCount = levelsCompleted + 1;
      dispatch(setLevelsCompleted(newLevelCount));
      dispatch(updateHighestEndlessLevel(completedLevelNumber));
      dispatch(saveMazeProgress());
      if (newLevelCount > (settings.highestScore || 0)) {
        dispatch(updateSettings({ highestScore: newLevelCount }));
        dispatch(saveSettings({ highestScore: newLevelCount }));
      }
      const bonusCoins = Math.floor(difficulty * 3);
      if (bonusCoins > 0) {
        for (let i = 0; i < bonusCoins; i++) {
          dispatch(collectCoinAndSave());
        }
      }
      dispatch(setShowLevelTransition(true));
      resetPhysics();
    }
  }, [dispatch, gameState, difficulty, levelsCompleted, settings.highestScore, resetPhysics]);
  useEffect(() => {
    if (
      gameState === 'playing' &&
      !isManualRecalibrating &&
      gyroIsCalibrated &&
      hasDeviceMovedSignificantly()
    ) {
      resetGyroscope();
    }
  }, [
    gameState,
    gyroIsCalibrated,
    isManualRecalibrating,
    hasDeviceMovedSignificantly,
    resetGyroscope,
  ]);
  useEffect(() => {
    if (gameState === 'playing') {
      if (gameOver && !showDeathAnimation) {
        handleGameOver();
      } else if (goalReached && !showLevelTransition) {
        handleGoalReachedAndNextLevel();
      }
    }
  }, [
    gameState,
    gameOver,
    goalReached,
    showDeathAnimation,
    showLevelTransition,
    handleGameOver,
    handleGoalReachedAndNextLevel,
  ]);
  useEffect(() => {
    const handleBackPress = () => {
      if (gameState === 'playing') {
        showQuitConfirm();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [gameState]);
  const handleDeathAnimationComplete = useCallback(() => {
    setTimeout(() => {
      dispatch(setShowDeathAnimation(false));
      dispatch(setGameState('game_over'));
      if (settings.vibrationEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 200);
  }, [dispatch, settings.vibrationEnabled]);
  const handleLevelTransitionComplete = useCallback(() => {
    dispatch(setShowLevelTransition(false));
    const nextDifficulty = Math.min(difficulty + 1, GAME.MAX_DIFFICULTY);
    const nextMaze = generateMaze(nextDifficulty);
    dispatch(setDifficulty(nextDifficulty));
    dispatch(setCurrentMaze(nextMaze));
    dispatch(setShowCalibrationOverlay(true));
    if (gyroscopeAvailable) {
      forceGyroscopeCalibration(200); 
      const checkCalibration = () => {
        if (!gyroIsCalibrating) {
          dispatch(setGyroscopeCalibrated(true));
          dispatch(setShowCalibrationOverlay(false));
          dispatch(setGameState('playing'));
          if (settings.vibrationEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } else {
          setTimeout(checkCalibration, 16);
        }
      };
      checkCalibration();
    } else {
      dispatch(setShowCalibrationOverlay(false));
      dispatch(setGameState('playing'));
    }
  }, [dispatch, difficulty, GAME.MAX_DIFFICULTY, gyroscopeAvailable, forceGyroscopeCalibration, gyroIsCalibrating, settings.vibrationEnabled]);
  const handleExit = useCallback(() => {
    dispatch(resetGame());
    setTimeout(() => {
      navigation.goBack();
    }, 50);
  }, [dispatch, navigation]);
  const onContinuePlaying = useCallback(() => {
    dispatch(continueAfterAd());
    resetPhysics();
    dispatch(setShowCalibrationOverlay(true));
    if (gyroscopeAvailable) {
      forceGyroscopeCalibration(200); 
      const checkCalibration = () => {
        if (!gyroIsCalibrating) {
          dispatch(setGyroscopeCalibrated(true));
          dispatch(setShowCalibrationOverlay(false));
          if (settings.vibrationEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } else {
          setTimeout(checkCalibration, 16);
        }
      };
      checkCalibration();
    } else {
      dispatch(setShowCalibrationOverlay(false));
    }
  }, [dispatch, resetPhysics, gyroscopeAvailable, forceGyroscopeCalibration, gyroIsCalibrating, settings.vibrationEnabled]);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [adRetryAttempt, setAdRetryAttempt] = useState(0);
  const [isForcePreloading, setIsForcePreloading] = useState(false);
  
  // Function to handle watching ads with improved TestFlight support
  const tryShowRewardedAd = useCallback(async () => {
    if (isLoadingAd) return;
    
    setIsLoadingAd(true);
    setAdRetryAttempt(prev => prev + 1);
    
    // Force preload ad before attempting to show it
    setIsForcePreloading(true);

    try {
      const adShown = await showRewardedAd(
        () => {
          // Only continue if user actually watched the ad and earned the reward
          onContinuePlaying();
        },
        () => {
          // Ad was closed - check if user watched it or skipped it
          // onContinuePlaying() will only be called if reward was earned in the reward callback above
        }
      );

      if (!adShown) {
        // Ad failed to show - show error message and don't allow continue
        Alert.alert(
          'Ad Unavailable',
          'Sorry, no ads are available right now. Try again later to continue playing.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Error showing ad - show error message and don't allow continue
      Alert.alert(
        'Ad Error',
        'There was an error loading the ad. Please try again later to continue playing.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingAd(false);
      setIsForcePreloading(false);
      setAdRetryAttempt(0);
    }
  }, [isLoadingAd, onContinuePlaying]);



  const showQuitConfirm = () => setIsQuitConfirmVisible(true);
  const hideQuitConfirm = () => setIsQuitConfirmVisible(false);
  const handleQuitConfirm = () => {
    hideQuitConfirm();
    dispatch(resetGame());
    navigation.goBack();
  };
  const handleResetTilt = useCallback(() => {
    if (recalibrationTimeoutRef.current) {
      clearTimeout(recalibrationTimeoutRef.current);
    }
    dispatch(setIsManualRecalibrating(true));
    dispatch(setShowCalibrationOverlay(true));
  }, []);
  const handleCalibrationComplete = useCallback(() => {
    forceGyroscopeCalibration(200); 
    const checkCalibration = () => {
      if (!gyroIsCalibrating) {
        dispatch(setGyroscopeCalibrated(true));
        dispatch(setShowCalibrationOverlay(false));
        if (settings.vibrationEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setSnackbarVisible(true);
        recalibrationTimeoutRef.current = setTimeout(() => {
          dispatch(setIsManualRecalibrating(false));
        }, 500);
      } else {
        setTimeout(checkCalibration, 16);
      }
    };
    checkCalibration();
  }, [dispatch, forceGyroscopeCalibration, gyroIsCalibrating, settings.vibrationEnabled]);
  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // App going to background
      if (
        (prevAppStateRef.current === 'active' || prevAppStateRef.current.match(/inactive/)) &&
        (nextAppState === 'background' || nextAppState.match(/inactive/))
      ) {
        // Save current game state if we're playing
        wasPlayingBeforeBackgroundRef.current = (gameState === 'playing');
        
        // If we're in the middle of a game, pause physics and animations
        if (gameState === 'playing') {
          // We don't want to create a pause state, just remember we were playing
        }
      }
      
      // App coming back to foreground
      if (
        prevAppStateRef.current.match(/background|inactive/) &&
        nextAppState === 'active'
      ) {
        // If user was playing before backgrounding, continue the game
        if (wasPlayingBeforeBackgroundRef.current) {
          // Resume the game state
          wasPlayingBeforeBackgroundRef.current = false;
        }
      }
      
      prevAppStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [gameState]);
  const isFirstLevelRef = useRef(true);
  useEffect(() => {
    if (gameState === 'loading') {
      dispatch(setDifficulty(1));
      dispatch(setLevelsCompleted(0));
      const initialMaze = generateMaze(1);
      dispatch(setCurrentMaze(initialMaze));
      if (isFirstLevelRef.current) {
        dispatch(setGameState('playing'));
        setTimeout(() => {
          dispatch(setShowCalibrationOverlay(true));
          resetPhysics();
          if (gyroscopeAvailable) {
            forceGyroscopeCalibration(500); 
            const checkInitialCalibration = () => {
              if (!gyroIsCalibrating) {
                dispatch(setGyroscopeCalibrated(true));
                dispatch(setShowCalibrationOverlay(false));
                resetPhysics();
                if (settings.vibrationEnabled) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                isFirstLevelRef.current = false;
              } else {
                setTimeout(checkInitialCalibration, 16);
              }
            };
            checkInitialCalibration();
          } else {
            dispatch(setShowCalibrationOverlay(false));
            isFirstLevelRef.current = false;
          }
        }, 300); 
      } else {
        dispatch(setShowCalibrationOverlay(true));
        if (gyroscopeAvailable) {
          forceGyroscopeCalibration(300);
          const checkCalibration = () => {
            if (!gyroIsCalibrating) {
              dispatch(setGyroscopeCalibrated(true));
              dispatch(setShowCalibrationOverlay(false));
              dispatch(setGameState('playing'));
              if (settings.vibrationEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            } else {
              setTimeout(checkCalibration, 16);
            }
          };
          checkCalibration();
        } else {
          dispatch(setShowCalibrationOverlay(false));
          dispatch(setGameState('playing'));
        }
      }
    } else if (gameState === 'playing' && gameOver) {
      dispatch(setGameOver(false));
    }
  }, [gameState, gameOver, dispatch, gyroscopeAvailable, forceGyroscopeCalibration, gyroIsCalibrating, settings.vibrationEnabled, resetPhysics]);
  if (gameState === 'loading' || !currentMaze) {
    return (
      <View style={gameScreenStyles.screen}>
        <StatusBar style="auto" />
      </View>
    );
  }
  return (
    <View style={[gameScreenStyles.screen, { backgroundColor: colors?.background ?? '#fff' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <GameHeader
        score={levelsCompleted}
        onQuit={showQuitConfirm}
        colors={colors}
      />
      <View
        style={{
          backgroundColor: colors?.surface,
          marginHorizontal: 16,
          marginVertical: 8,
          padding: 12,
          borderRadius: 8,
          shadowColor: colors?.onSurface,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Text
          style={{
            color: colors?.onSurface,
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 8,
          }}
        >
          Sensitivity: {sliderValue.toFixed(1)}x
        </Text>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={1}
          maximumValue={10}
          step={0.5}
          value={sliderValue}
          onValueChange={handleSensitivityChange}
          onSlidingStart={handleSlidingStart}
          onSlidingComplete={handleSlidingComplete}
          minimumTrackTintColor={colors?.primary}
          maximumTrackTintColor={colors?.onSurfaceVariant}
          thumbTintColor={colors?.primary}
        />
      </View>
      <View style={gameScreenStyles.mazeOuterContainer}>
        <PhysicsMaze
          maze={currentMaze!}
          gyroX={gyroData.x}
          gyroY={gyroData.y}
          gameState={gameState}
          isTransitioning={showLevelTransition}
          isDying={showDeathAnimation}
          ballPositionX={ballPositionX}
          ballPositionY={ballPositionY}
          update={update}
          colors={colors}
          ballRadius={physicsOptions.ballRadius}
        />
      </View>
      <Portal>
        <QuitConfirmDialog
          visible={isQuitConfirmVisible}
          onDismiss={hideQuitConfirm}
          onConfirm={handleQuitConfirm}
          colors={colors}
        />
      {gameState === 'game_over' && (
        <Portal>
          <GameOverOverlay
            score={levelsCompleted}
            bestScore={settings.highestScore ?? 0}
            onPlayAgain={handlePlayAgain}
            onExit={handleExit}
            onWatchAd={tryShowRewardedAd}

            isLoadingAd={isLoadingAd}
          />
        </Portal>
      )}
      {showCalibrationOverlay && (
        <Portal>
          <TiltCalibrationOverlay
            onCalibrationComplete={handleCalibrationComplete}
            colors={colors}
            duration={2000}
            vibrationEnabled={settings.vibrationEnabled}
          />
        </Portal>
      )}
      {showLevelTransition && (
        <Portal>
          <LevelTransition
            level={difficulty}
            visible={showLevelTransition}
            onTransitionComplete={handleLevelTransitionComplete}
            colors={colors}
          />
        </Portal>
      )}
        <Portal>
      <SimpleDeathScreen
        visible={showDeathAnimation}
        onAnimationComplete={handleDeathAnimationComplete}
        colors={colors}
      />
        </Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={Snackbar.DURATION_SHORT}
          style={{
            backgroundColor: colors?.inverseSurface ?? colors?.onSurface,
            marginBottom: 50,
          }}
          theme={{
            colors: {
              inverseSurface: colors?.surface,
              inverseOnSurface: colors?.inverseOnSurface ?? colors?.surface,
            },
          }}
        >
          <Text style={{ color: colors?.inverseOnSurface ?? colors?.surface }}>
            Tilt orientation reset!
          </Text>
        </Snackbar>
      </Portal>
    </View>
  );
};
export default GameScreen;
