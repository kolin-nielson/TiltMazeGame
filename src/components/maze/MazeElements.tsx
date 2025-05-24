import React, { memo, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Polygon, G, Defs, Stop, RadialGradient } from 'react-native-svg';
import Animated, { FadeOut, FadeIn, useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing } from 'react-native-reanimated';
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

const CoinCircle = memo(({ coin, ballRadius, colors }: { coin: Coin, ballRadius: number, colors: ThemeColors }) => {
  const anim = useSharedValue(0);
  
  useEffect(() => {
    anim.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const isSpecial = coin.isSpecial || false;
  
  // More satisfying scale animation
  const scaleProps = useAnimatedProps(() => {
    const scale = Math.sin(anim.value * 2 * Math.PI) * 0.12 + 1;
    return { r: ballRadius * 0.8 * scale };
  });

  if (isSpecial) {
    // Vibrant Diamond - Gem-like and sparkly
    const diamondProps = useAnimatedProps(() => {
      const scale = Math.sin(anim.value * 2 * Math.PI) * 0.08 + 1;
      const size = ballRadius * 1.3 * scale;
      
      const points = [
        `${coin.position.x},${coin.position.y - size}`,      // Top
        `${coin.position.x + size * 0.7},${coin.position.y}`, // Right
        `${coin.position.x},${coin.position.y + size}`,      // Bottom
        `${coin.position.x - size * 0.7},${coin.position.y}` // Left
      ].join(' ');
      
      return { points };
    });

    // Sparkle animations
    const sparkleProps1 = useAnimatedProps(() => {
      const sparkleScale = Math.sin(anim.value * 4 * Math.PI) * 0.4 + 0.6;
      return { r: ballRadius * 0.2 * sparkleScale };
    });

    const sparkleProps2 = useAnimatedProps(() => {
      const sparkleScale = Math.sin(anim.value * 3 * Math.PI + Math.PI/2) * 0.3 + 0.7;
      return { r: ballRadius * 0.15 * sparkleScale };
    });

    return (
      <AnimatedG entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
        <Defs>
          <RadialGradient id={`diamond-gradient-${coin.id}`} cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#E0E7FF" stopOpacity="1" />
            <Stop offset="30%" stopColor="#8B5CF6" stopOpacity="1" />
            <Stop offset="70%" stopColor="#7C3AED" stopOpacity="1" />
            <Stop offset="100%" stopColor="#5B21B6" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Main diamond with vibrant gradient */}
        <AnimatedPolygon
          animatedProps={diamondProps}
          fill={`url(#diamond-gradient-${coin.id})`}
          stroke="#FFFFFF"
          strokeWidth={3}
        />
        
        {/* Inner diamond for depth */}
        <AnimatedPolygon
          animatedProps={useAnimatedProps(() => {
            const scale = Math.sin(anim.value * 2 * Math.PI + Math.PI) * 0.05 + 1;
            const size = ballRadius * 0.9 * scale;
            
            const points = [
              `${coin.position.x},${coin.position.y - size}`,
              `${coin.position.x + size * 0.7},${coin.position.y}`,
              `${coin.position.x},${coin.position.y + size}`,
              `${coin.position.x - size * 0.7},${coin.position.y}`
            ].join(' ');
            
            return { points };
          })}
          fill="#C4B5FD"
          opacity="0.8"
        />
        
        {/* Sparkle effects */}
        <AnimatedCircle
          cx={coin.position.x - ballRadius * 0.4}
          cy={coin.position.y - ballRadius * 0.3}
          animatedProps={sparkleProps1}
          fill="#FFFFFF"
        />
        
        <AnimatedCircle
          cx={coin.position.x + ballRadius * 0.3}
          cy={coin.position.y + ballRadius * 0.2}
          animatedProps={sparkleProps2}
          fill="#FFFFFF"
          opacity="0.9"
        />
        
        {/* Extra sparkle for more satisfaction */}
        <AnimatedCircle
          cx={coin.position.x - ballRadius * 0.2}
          cy={coin.position.y + ballRadius * 0.4}
          animatedProps={useAnimatedProps(() => {
            const sparkleScale = Math.sin(anim.value * 5 * Math.PI + Math.PI) * 0.25 + 0.75;
            return { r: ballRadius * 0.12 * sparkleScale };
          })}
          fill="#FFFFFF"
          opacity="0.8"
        />
      </AnimatedG>
    );
  } else {
    // Vibrant Coin - Golden and satisfying
    return (
      <AnimatedG entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
        <Defs>
          <RadialGradient id={`coin-gradient-${coin.id}`} cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#FEF3C7" stopOpacity="1" />
            <Stop offset="30%" stopColor="#FBBF24" stopOpacity="1" />
            <Stop offset="70%" stopColor="#F59E0B" stopOpacity="1" />
            <Stop offset="100%" stopColor="#D97706" stopOpacity="1" />
          </RadialGradient>
          
          <RadialGradient id={`coin-inner-${coin.id}`} cx="50%" cy="30%" r="60%">
            <Stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
            <Stop offset="50%" stopColor="#FDE68A" stopOpacity="1" />
            <Stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Outer glow for premium feel */}
        <AnimatedCircle
          animatedProps={useAnimatedProps(() => {
            const scale = Math.sin(anim.value * 2 * Math.PI) * 0.15 + 1;
            return { r: ballRadius * 0.95 * scale };
          })}
          cx={coin.position.x}
          cy={coin.position.y}
          fill="#FDE68A"
          opacity="0.4"
        />
        
        {/* Vibrant coin with gradient */}
        <AnimatedCircle
          animatedProps={scaleProps}
          cx={coin.position.x}
          cy={coin.position.y}
          fill={`url(#coin-gradient-${coin.id})`}
          stroke="#FFFFFF"
          strokeWidth={3}
        />
        
        {/* Inner ring for depth */}
        <AnimatedCircle
          animatedProps={useAnimatedProps(() => {
            const scale = Math.sin(anim.value * 2 * Math.PI + Math.PI) * 0.08 + 1;
            return { r: ballRadius * 0.6 * scale };
          })}
          cx={coin.position.x}
          cy={coin.position.y}
          fill={`url(#coin-inner-${coin.id})`}
          opacity="0.9"
        />
        
        {/* Center symbol - classic coin star */}
        <AnimatedCircle
          cx={coin.position.x}
          cy={coin.position.y}
          r={ballRadius * 0.25}
          fill="#FFFBEB"
          stroke="#D97706"
          strokeWidth={2}
        />
        
        {/* Sparkle effects for satisfaction */}
        <AnimatedCircle
          cx={coin.position.x - ballRadius * 0.4}
          cy={coin.position.y - ballRadius * 0.3}
          animatedProps={useAnimatedProps(() => {
            const sparkleScale = Math.sin(anim.value * 4 * Math.PI) * 0.3 + 0.7;
            return { r: ballRadius * 0.18 * sparkleScale };
          })}
          fill="#FFFFFF"
        />
        
        <AnimatedCircle
          cx={coin.position.x + ballRadius * 0.3}
          cy={coin.position.y + ballRadius * 0.2}
          animatedProps={useAnimatedProps(() => {
            const sparkleScale = Math.sin(anim.value * 3 * Math.PI + Math.PI/2) * 0.3 + 0.7;
            return { r: ballRadius * 0.14 * sparkleScale };
          })}
          fill="#FFFFFF"
          opacity="0.9"
        />
        
        {/* Additional sparkle for extra satisfaction */}
        <AnimatedCircle
          cx={coin.position.x - ballRadius * 0.15}
          cy={coin.position.y + ballRadius * 0.4}
          animatedProps={useAnimatedProps(() => {
            const sparkleScale = Math.sin(anim.value * 5 * Math.PI + Math.PI) * 0.2 + 0.8;
            return { r: ballRadius * 0.1 * sparkleScale };
          })}
          fill="#FFFFFF"
          opacity="0.8"
        />
      </AnimatedG>
    );
  }
});

export const MazeElements: React.FC<MazeElementsProps> = ({ maze, ballPositionX, ballPositionY, ballRadius, colors, gameState = 'playing' }) => {
  const mazeBaseSize = 300;
  const coinsInMaze = useMemo(() => maze.coins ?? [], [maze.coins]);
  
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
          {}
          <MazeGoal
            position={maze.endPosition}
            ballRadius={ballRadius}
            colors={colors}
          />
          <MemoizedWalls walls={maze.walls} color={colors?.walls ?? '#333333'} />
          {maze.laserGates && Array.isArray(maze.laserGates) && maze.laserGates.length > 0 && (
            <MemoizedLaserGates
              laserGates={maze.laserGates}
              color={colors?.laser ?? '#FF0000'}
              isActive={gameState === 'playing'}
            />
          )}
        {coinsInMaze.map(coin => (
          <CoinCircle key={coin.id} coin={coin} ballRadius={ballRadius} colors={colors} />
        ))}
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
};

export default MazeElements;
