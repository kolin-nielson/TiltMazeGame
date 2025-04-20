import React, { memo, useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';
import Svg from 'react-native-svg';
import { Maze, Position, Wall, LaserGate } from '@types';
import { MazeWall } from './MazeWall';
import { MazeGoal } from './MazeGoal';
import { MazeBall } from './MazeBall';
import { MazeLaserGate } from './MazeLaserGate';
import { mazeRendererStyles } from '@styles/MazeRendererStyles';
import { ThemeColors } from '@types';
import Animated from 'react-native-reanimated';

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

export const MazeElements: React.FC<MazeElementsProps> = memo(
  ({ maze, ballPositionX, ballPositionY, ballRadius, colors, gameState = 'playing' }) => {
    const mazeBaseSize = 300;

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

          <MazeBall
            ballPositionX={ballPositionX}
            ballPositionY={ballPositionY}
            radius={ballRadius}
            color={colors?.ball ?? '#FF4081'}
          />
        </Svg>
      </View>
    );
  },
  (prevProps, nextProps) => {
    const mazeChanged = prevProps.maze.id !== nextProps.maze.id;
    const radiusChanged = prevProps.ballRadius !== nextProps.ballRadius;
    const gameStateChanged = prevProps.gameState !== nextProps.gameState;
    const colorsChanged =
      prevProps.colors?.goal !== nextProps.colors?.goal ||
      prevProps.colors?.walls !== nextProps.colors?.walls ||
      prevProps.colors?.ball !== nextProps.colors?.ball ||
      prevProps.colors?.laser !== nextProps.colors?.laser;

    return !(mazeChanged || radiusChanged || colorsChanged || gameStateChanged);
  }
);
