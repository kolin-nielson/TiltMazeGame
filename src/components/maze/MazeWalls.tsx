import React, { memo } from 'react';
import { View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Maze, ThemeColors, Wall } from '../types';
import { MazeElements } from './maze/MazeElements';
import { mazeRendererStyles } from '../styles/MazeRendererStyles';
import Animated from 'react-native-reanimated';
import { MazeGoal } from './maze/MazeGoal';
import { MazeBall } from './maze/MazeBall';
import { MazeLaserGate } from './maze/MazeLaserGate';
import { MazeWall } from './maze/MazeWall';

// Memoized wall component to reduce render overhead
export const MemoizedWalls = memo(
  ({ walls, color }: { walls: Wall[]; color: string }) => {
    return (
      <>
        {walls.map((wall, index) => (
          <MazeWall key={`wall-${index}`} wall={wall} index={index} color={color} />
        ))}
      </>
    );
  }
);

interface MazeRendererProps {
  maze: Maze;
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  ballRadius?: number;
  containerStyle?: object;
  colors: ThemeColors;
  gameState?: 'ready' | 'playing' | 'paused' | 'completed' | 'game_over';
}

const MazeRenderer: React.FC<MazeRendererProps> = ({
  maze,
  ballPositionX,
  ballPositionY,
  ballRadius = 7,
  containerStyle = {},
  colors,
  gameState = 'playing',
}) => {
  const { theme, colors: themeColors } = useTheme();
  const mazeSize = 300;

  const containerStyles = useMemo(
    () => [
      mazeRendererStyles.container,
      containerStyle,
      {
        backgroundColor: themeColors?.surface ?? '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
      },
    ],
    [containerStyle, themeColors?.surface]
  );

  return (
    <View style={containerStyles}>
      <MazeElements
        maze={maze}
        ballPositionX={ballPositionX}
        ballPositionY={ballPositionY}
        ballRadius={ballRadius}
        colors={colors}
        gameState={gameState}
      >
        <MazeGoal position={maze.endPosition} ballRadius={ballRadius} color={colors?.goal ?? '#4CAF50'} />
        <MemoizedWalls walls={maze.walls} color={colors?.walls ?? '#333333'} />
        {maze.laserGates && Array.isArray(maze.laserGates) && maze.laserGates.length > 0 && (
          <>
            {maze.laserGates.map((laserGate) => (
              <MazeLaserGate
                key={`laser-${laserGate.id}`}
                laserGate={laserGate}
                color={colors?.laser ?? '#FF0000'}
                isActive={gameState === 'playing'}
              />
            ))}
          </>
        )}
        <MazeBall
          ballPositionX={ballPositionX}
          ballPositionY={ballPositionY}
          radius={ballRadius}
          color={colors?.ball ?? '#E53935'}
        />
      </MazeElements>
    </View>
  );
};

export default memo(MazeRenderer, (prevProps, nextProps) => {
  const mazeChanged = prevProps.maze.id !== nextProps.maze.id;
  const radiusChanged = prevProps.ballRadius !== nextProps.ballRadius;
  const colorsChanged =
    prevProps.colors?.surface !== nextProps.colors?.surface ||
    prevProps.colors?.walls !== nextProps.colors?.walls ||
    prevProps.colors?.ball !== nextProps.colors?.ball ||
    prevProps.colors?.goal !== nextProps.colors?.goal ||
    prevProps.colors?.laser !== nextProps.colors?.laser;

  const gameStateChanged = prevProps.gameState !== nextProps.gameState;

  return !(mazeChanged || radiusChanged || colorsChanged || gameStateChanged);
});