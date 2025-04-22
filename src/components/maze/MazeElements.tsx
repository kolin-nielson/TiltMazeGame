import React, { memo, useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeOut, FadeIn } from 'react-native-reanimated';
import { MazeWall } from './MazeWall';
import { MazeGoal } from './MazeGoal';
import { MazeBall } from './MazeBall';
import { MazeLaserGate } from './MazeLaserGate';
import { mazeRendererStyles } from '@styles/MazeRendererStyles';
import { ThemeColors } from '@types';
import { useAppSelector, RootState } from '@store';

// Create Animated Circle for entry/exit animations
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MazeElementsProps {
  maze: Maze;
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  ballRadius: number;
  colors: ThemeColors;
  gameState?: 'ready' | 'playing' | 'paused' | 'completed' | 'game_over';
}

const MemoizedWalls = memo(({ walls, color }: { walls: Wall[]; color: string }) => {
  return (
    <>
      {walls.map((wall, index) => (
        <MazeWall key={`wall-${index}`} wall={wall} index={index} color={color} />
      ))}
    </>
  );
});

const MemoizedLaserGates = memo(
  ({
    laserGates,
    color,
    isActive,
  }: {
    laserGates: LaserGate[];
    color: string;
    isActive: boolean;
  }) => {
    return (
      <>
        {laserGates.map(laserGate => (
          <MazeLaserGate
            key={`laser-${laserGate.id}`}
            laserGate={laserGate}
            color={color}
            isActive={isActive}
          />
        ))}
      </>
    );
  }
);

// Component for a single coin with animation
const CoinCircle = memo(({ coin, ballRadius }: { coin: { id: string, position: Position }, ballRadius: number }) => {
  const [animPhase, setAnimPhase] = useState(0);
  
  useEffect(() => {
    // Simple pulse animation
    const interval = setInterval(() => {
      setAnimPhase(prev => (prev + 1) % 60);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate pulse effect (subtle size change)
  const pulseSize = (Math.sin(animPhase / 10) * 0.1) + 1;
  const glowRadius = ballRadius * 0.8 * pulseSize;
  const coinRadius = ballRadius * 0.6;
  
  return (
    <React.Fragment>
      {/* Glow effect */}
      <AnimatedCircle
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(300)}
        cx={coin.position.x}
        cy={coin.position.y}
        r={glowRadius}
        fill="#FFDF0040"
      />
      {/* Coin body */}
      <AnimatedCircle
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(300)}
        cx={coin.position.x}
        cy={coin.position.y}
        r={coinRadius}
        fill="#FFD700"
        stroke="#FFA500"
        strokeWidth={1}
      />
    </React.Fragment>
  );
});

export const MazeElements: React.FC<MazeElementsProps> = ({ maze, ballPositionX, ballPositionY, ballRadius, colors, gameState = 'playing' }) => {
  const mazeBaseSize = 300;
  // Subscribe to coins in Redux to ensure re-render on removal
  const coinsInMaze = useAppSelector((state: RootState) => state.maze.currentMaze?.coins || []);
  // Log coin count for debugging
  useEffect(() => {
    console.log(`[MazeElements] Rendering with ${coinsInMaze.length} coins.`);
  }, [coinsInMaze.length]);

  return (
    <View style={mazeRendererStyles.mazeElementsContainer}>
      <Svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        viewBox={`0 0 ${mazeBaseSize} ${mazeBaseSize}`}
        preserveAspectRatio="none"
      >
        <MazeGoal
          position={maze.endPosition}
          ballRadius={ballRadius}
          color={colors?.goal ?? '#4CAF50'}
        />

        <MemoizedWalls walls={maze.walls} color={colors?.walls ?? '#333333'} />

        {maze.laserGates && maze.laserGates.length > 0 && (
          <MemoizedLaserGates
            laserGates={maze.laserGates}
            color={colors?.laser ?? '#FF0000'}
            isActive={gameState === 'playing'}
          />
        )}

        {coinsInMaze.map(coin => (
          <CoinCircle key={coin.id} coin={coin} ballRadius={ballRadius} />
        ))}

        <MazeBall
          ballPositionX={ballPositionX}
          ballPositionY={ballPositionY}
          radius={ballRadius}
          color={colors?.ball ?? '#FF4081'}
        />
      </Svg>
    </View>
  );
};

export default MazeElements;
