import React, { memo, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';
import Animated, { FadeOut, FadeIn, useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { MazeWall } from './MazeWall';
import { MazeGoal } from './MazeGoal';
import { MazeBall } from './MazeBall';
import { MazeLaserGate } from './MazeLaserGate';
import { mazeRendererStyles } from '@styles/MazeRendererStyles';
import { ThemeColors, Maze, Wall, LaserGate, Position, Coin } from '@types';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
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
const CoinCircle = memo(({ coin, ballRadius }: { coin: Coin, ballRadius: number }) => {
  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.linear }),
      -1,
      true
    );
  }, []);
  const isSpecial = coin.isSpecial || false;
  
  // Regular coin glow and body props
  const glowProps = useAnimatedProps(() => {
    const scale = Math.sin(anim.value * 2 * Math.PI) * 0.1 + 1;
    return { r: ballRadius * 0.8 * scale };
  });
  const bodyProps = useAnimatedProps(() => {
    const scale = Math.sin(anim.value * 2 * Math.PI) * 0.1 + 1;
    return { r: ballRadius * 0.6 * scale };
  });
  
  // Special diamond props
  const diamondAnimProps = useAnimatedProps(() => {
    const scale = Math.sin(anim.value * 2 * Math.PI) * 0.1 + 1;
    const size = ballRadius * 1.6 * scale; // Size of the diamond
    
    // Calculate the four points of the diamond
    const points = [
      `${coin.position.x},${coin.position.y - size}`,      // Top
      `${coin.position.x + size},${coin.position.y}`,       // Right
      `${coin.position.x},${coin.position.y + size}`,       // Bottom
      `${coin.position.x - size},${coin.position.y}`        // Left
    ].join(' ');
    
    return { points };
  });
  
  const diamondGlowProps = useAnimatedProps(() => {
    const scale = Math.sin(anim.value * 2 * Math.PI) * 0.1 + 1;
    const size = ballRadius * 2.0 * scale; // Size of the glow diamond
    
    const points = [
      `${coin.position.x},${coin.position.y - size}`,      // Top
      `${coin.position.x + size},${coin.position.y}`,       // Right
      `${coin.position.x},${coin.position.y + size}`,       // Bottom
      `${coin.position.x - size},${coin.position.y}`        // Left
    ].join(' ');
    
    return { points };
  });
  
  // Colors
  const glowColor = isSpecial ? "#4B0082AA" : "#FFDF0040"; // Purple glow for diamond
  const fillColor = isSpecial ? "#9370DB" : "#FFD700";    // Medium purple fill for diamond
  const strokeColor = isSpecial ? "#6A0DAD" : "#FFA500";  // Darker purple stroke for diamond
  
  if (isSpecial) {
    return (
      <>
        <AnimatedPolygon
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(300)}
          animatedProps={diamondGlowProps}
          fill={glowColor}
        />
        <AnimatedPolygon
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(300)}
          animatedProps={diamondAnimProps}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
        />
      </>
    );
  } else {
    return (
      <>
        <AnimatedCircle
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(300)}
          animatedProps={glowProps}
          cx={coin.position.x}
          cy={coin.position.y}
          fill={glowColor}
        />
        <AnimatedCircle
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(300)}
          animatedProps={bodyProps}
          cx={coin.position.x}
          cy={coin.position.y}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={1}
        />
      </>
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
          <CoinCircle key={coin.id} coin={coin} ballRadius={ballRadius} />
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
