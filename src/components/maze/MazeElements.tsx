import React, { memo, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeOut, FadeIn, useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { MazeWall } from './MazeWall';
import { MazeGoal } from './MazeGoal';
import { MazeBall } from './MazeBall';
import { MazeLaserGate } from './MazeLaserGate';
import { mazeRendererStyles } from '@styles/MazeRendererStyles';
import { ThemeColors, Maze, Wall, LaserGate, Position, Coin } from '@types';
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
  const glowProps = useAnimatedProps(() => {
    const scale = Math.sin(anim.value * 2 * Math.PI) * 0.1 + 1;
    return { r: ballRadius * (isSpecial ? 1.0 : 0.8) * scale };
  });
  const bodyProps = useAnimatedProps(() => {
    const scale = Math.sin(anim.value * 2 * Math.PI) * 0.1 + 1;
    return { r: ballRadius * (isSpecial ? 0.8 : 0.6) * scale };
  });
  const glowColor = isSpecial ? "#FF5E0040" : "#FFDF0040";
  const fillColor = isSpecial ? "#FF5E00" : "#FFD700";
  const strokeColor = isSpecial ? "#FF3D00" : "#FFA500";
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
        strokeWidth={isSpecial ? 2 : 1}
      />
    </>
  );
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
