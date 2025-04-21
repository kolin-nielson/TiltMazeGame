import React, { memo, useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Maze, Position, Wall, LaserGate } from '@types';
import { MazeWall } from './MazeWall';
import { MazeGoal } from './MazeGoal';
import { MazeBall } from './MazeBall';
import { MazeLaserGate } from './MazeLaserGate';
import { mazeRendererStyles } from '@styles/MazeRendererStyles';
import { ThemeColors } from '@types';
import Animated from 'react-native-reanimated';
import { useAppSelector, RootState } from '@store';

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

          {maze.coins?.map(coin => (
            <React.Fragment key={coin.id}>
              {/* Glow effect */}
              <Circle
                cx={coin.position.x}
                cy={coin.position.y}
                r={ballRadius * 0.8}
                fill="#FFDF0040"
              />
              {/* Coin body */}
              <Circle
                cx={coin.position.x}
                cy={coin.position.y}
                r={ballRadius * 0.6}
                fill="#FFD700"
                stroke="#FFA500"
                strokeWidth={1}
              />
            </React.Fragment>
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
  }
);

export default MazeElements;
