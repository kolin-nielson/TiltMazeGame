import React, { memo, useMemo, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Polygon, G, Defs, Stop, RadialGradient } from 'react-native-svg';
import Animated, { FadeOut, FadeIn, useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing, runOnUI } from 'react-native-reanimated';
import { MazeWall } from './MazeWall';
import { MazeGoal } from './MazeGoal';
import { MazeBall } from './MazeBall';
import { MazeLaserGate } from './MazeLaserGate';
import { mazeRendererStyles } from '@styles/MazeRendererStyles';
import { ThemeColors, Maze, Wall, LaserGate, Position, Coin } from '@types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedG = Animated.createAnimatedComponent(G);

interface MazeElementsProps {
  maze: Maze;
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  ballRadius: number;
  colors: ThemeColors;
  gameState?: 'ready' | 'playing' | 'paused' | 'completed' | 'game_over';
}

// Optimized memoized walls component with better layering
const MemoizedWalls = memo(({ walls, color }: { walls: Wall[]; color: string }) => {
  const wallElements = useMemo(() => 
    walls.map((wall, index) => (
      <MazeWall key={`wall-${wall.x}-${wall.y}-${wall.width}-${wall.height}`} wall={wall} index={index} color={color} />
    ))
  , [walls, color]);
  
  // Use SVG group for clean wall rendering
  return (
    <G 
      style={{ mixBlendMode: 'normal' }}
      // Force crisp edges at the group level for all walls
      shapeRendering="crispEdges"
    >
      {wallElements}
    </G>
  );
});

// Optimized memoized laser gates component
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
    const laserElements = useMemo(() =>
      laserGates.map(laserGate => (
        <MazeLaserGate
          key={`laser-${laserGate.id}`}
          laserGate={laserGate}
          color={color}
          isActive={isActive}
        />
      ))
    , [laserGates, color, isActive]);
    
    return <>{laserElements}</>;
  }
);

// Highly optimized coin component with minimal re-renders
const CoinCircle = memo(({ coin, ballRadius, colors }: { coin: Coin, ballRadius: number, colors: ThemeColors }) => {
  const anim = useSharedValue(0);
  
  useEffect(() => {
    // Use runOnUI for better performance
    runOnUI(() => {
      anim.value = withRepeat(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    })();
  }, []);

  const isSpecial = coin.isSpecial || false;

  // Memoize gradient IDs to prevent recreation
  const gradientId = useMemo(() => `coin-gradient-${coin.id}`, [coin.id]);
  const innerGradientId = useMemo(() => `coin-inner-${coin.id}`, [coin.id]);
  const diamondGradientId = useMemo(() => `diamond-gradient-${coin.id}`, [coin.id]);

  if (isSpecial) {
    // Optimized Diamond - fewer animated elements
    const diamondProps = useAnimatedProps(() => {
      const scale = Math.sin(anim.value * 2 * Math.PI) * 0.08 + 1;
      const size = ballRadius * 1.3 * scale;
      
      const points = [
        `${coin.position.x},${coin.position.y - size}`,
        `${coin.position.x + size * 0.7},${coin.position.y}`,
        `${coin.position.x},${coin.position.y + size}`,
        `${coin.position.x - size * 0.7},${coin.position.y}`
      ].join(' ');
      
      return { points };
    });

    return (
      <AnimatedG entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
        <Defs>
          <RadialGradient id={diamondGradientId} cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#E0E7FF" stopOpacity="1" />
            <Stop offset="30%" stopColor="#8B5CF6" stopOpacity="1" />
            <Stop offset="70%" stopColor="#7C3AED" stopOpacity="1" />
            <Stop offset="100%" stopColor="#5B21B6" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Main diamond */}
        <AnimatedPolygon
          animatedProps={diamondProps}
          fill={`url(#${diamondGradientId})`}
          stroke="#FFFFFF"
          strokeWidth={3}
        />
        
        {/* Single inner diamond for depth */}
        <AnimatedCircle
          cx={coin.position.x}
          cy={coin.position.y}
          r={ballRadius * 0.4}
          fill="#C4B5FD"
          opacity="0.8"
        />
        
        {/* Optimized sparkles - only 2 instead of 3+ */}
        <AnimatedCircle
          cx={coin.position.x - ballRadius * 0.4}
          cy={coin.position.y - ballRadius * 0.3}
          animatedProps={useAnimatedProps(() => {
            const sparkle1 = Math.sin(anim.value * 4 * Math.PI) * 0.4 + 0.6;
            return { r: ballRadius * sparkle1 * 0.18 };
          })}
          fill="#FFFFFF"
        />
        
        <AnimatedCircle
          cx={coin.position.x + ballRadius * 0.3}
          cy={coin.position.y + ballRadius * 0.2}
          animatedProps={useAnimatedProps(() => {
            const sparkle2 = Math.sin(anim.value * 3 * Math.PI + Math.PI/2) * 0.3 + 0.7;
            return { r: ballRadius * sparkle2 * 0.14 };
          })}
          fill="#FFFFFF"
          opacity="0.9"
        />
      </AnimatedG>
    );
  } else {
    // Optimized Coin - fewer animated elements, reusing calculations
    return (
      <AnimatedG entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#FEF3C7" stopOpacity="1" />
            <Stop offset="30%" stopColor="#FBBF24" stopOpacity="1" />
            <Stop offset="70%" stopColor="#F59E0B" stopOpacity="1" />
            <Stop offset="100%" stopColor="#D97706" stopOpacity="1" />
          </RadialGradient>
          
          <RadialGradient id={innerGradientId} cx="50%" cy="30%" r="60%">
            <Stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
            <Stop offset="50%" stopColor="#FDE68A" stopOpacity="1" />
            <Stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Single outer glow - static for performance */}
        <AnimatedCircle
          cx={coin.position.x}
          cy={coin.position.y}
          r={ballRadius * 0.95}
          fill="#FDE68A"
          opacity="0.3"
        />
        
        {/* Main coin with optimized animation */}
        <AnimatedCircle
          animatedProps={useAnimatedProps(() => {
            const scale = Math.sin(anim.value * 2 * Math.PI) * 0.12 + 1;
            return { r: ballRadius * 0.8 * scale };
          })}
          cx={coin.position.x}
          cy={coin.position.y}
          fill={`url(#${gradientId})`}
          stroke="#FFFFFF"
          strokeWidth={3}
        />
        
        {/* Static inner ring - no animation for performance */}
        <AnimatedCircle
          cx={coin.position.x}
          cy={coin.position.y}
          r={ballRadius * 0.6}
          fill={`url(#${innerGradientId})`}
          opacity="0.9"
        />
        
        {/* Static center symbol */}
        <AnimatedCircle
          cx={coin.position.x}
          cy={coin.position.y}
          r={ballRadius * 0.25}
          fill="#FFFBEB"
          stroke="#D97706"
          strokeWidth={2}
        />
        
        {/* Only 2 optimized sparkles using shared calculations */}
        <AnimatedCircle
          cx={coin.position.x - ballRadius * 0.4}
          cy={coin.position.y - ballRadius * 0.3}
          animatedProps={useAnimatedProps(() => {
            const sparkle1 = Math.sin(anim.value * 4 * Math.PI) * 0.4 + 0.6;
            return { r: ballRadius * sparkle1 * 0.18 };
          })}
          fill="#FFFFFF"
        />
        
        <AnimatedCircle
          cx={coin.position.x + ballRadius * 0.3}
          cy={coin.position.y + ballRadius * 0.2}
          animatedProps={useAnimatedProps(() => {
            const sparkle2 = Math.sin(anim.value * 3 * Math.PI + Math.PI/2) * 0.3 + 0.7;
            return { r: ballRadius * sparkle2 * 0.14 };
          })}
          fill="#FFFFFF"
          opacity="0.9"
        />
      </AnimatedG>
    );
  }
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.coin.id === nextProps.coin.id &&
    prevProps.ballRadius === nextProps.ballRadius &&
    prevProps.colors === nextProps.colors
  );
});

export const MazeElements: React.FC<MazeElementsProps> = memo(({ maze, ballPositionX, ballPositionY, ballRadius, colors, gameState = 'playing' }) => {
  const mazeBaseSize = 300;
  
  // Memoize coins to prevent unnecessary re-renders
  const coinsInMaze = useMemo(() => maze.coins ?? [], [maze.coins]);
  
  // Memoize laser gates filtering
  const activeLaserGates = useMemo(() => 
    maze.laserGates && Array.isArray(maze.laserGates) ? maze.laserGates : []
  , [maze.laserGates]);
  
  // Memoize coin components
  const coinComponents = useMemo(() =>
    coinsInMaze.map(coin => (
      <CoinCircle key={coin.id} coin={coin} ballRadius={ballRadius} colors={colors} />
    ))
  , [coinsInMaze, ballRadius, colors]);
  
  return (
    <View style={mazeRendererStyles.mazeElementsContainer}>
      <View style={{
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Svg
          style={{
            width: '100%',  // Maximum width to fill all available space
            height: '100%', // Maximum height to fill all available space
            aspectRatio: 1, // Force square aspect ratio
            alignSelf: 'center',
          }}
          viewBox={`0 0 ${mazeBaseSize} ${mazeBaseSize}`}
          preserveAspectRatio="xMidYMid meet" // Maintain aspect ratio
        >
          <MazeGoal
            position={maze.endPosition}
            ballRadius={ballRadius}
            colors={colors}
          />
          <MemoizedWalls walls={maze.walls} color={colors?.walls ?? '#333333'} />
          {activeLaserGates.length > 0 && (
            <MemoizedLaserGates
              laserGates={activeLaserGates}
              color={colors?.laser ?? '#FF0000'}
              isActive={gameState === 'playing'}
            />
          )}
          {coinComponents}
          <MazeBall
            key="maze-ball"
            ballPositionX={ballPositionX}
            ballPositionY={ballPositionY}
            radius={ballRadius}
          />
        </Svg>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for maze elements to prevent unnecessary re-renders
  return (
    prevProps.maze === nextProps.maze &&
    prevProps.ballRadius === nextProps.ballRadius &&
    prevProps.colors === nextProps.colors &&
    prevProps.gameState === nextProps.gameState
  );
});

export default MazeElements;
