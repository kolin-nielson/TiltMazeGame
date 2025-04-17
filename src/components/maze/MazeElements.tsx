import React, { memo, useMemo, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg from 'react-native-svg';
import { Maze, Position, Wall, LaserGate } from '../../types';
import { MazeWall } from './MazeWall';
import { MazeGoal } from './MazeGoal';
import { MazeBall } from './MazeBall';
import { MazeLaserGate } from './MazeLaserGate';
import { mazeRendererStyles } from '../../styles/MazeRendererStyles';
import { ThemeColors } from '../../types';
import Animated from 'react-native-reanimated';

interface MazeElementsProps {
  maze: Maze;
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  ballRadius: number;
  colors: ThemeColors;
  gameState?: 'ready' | 'playing' | 'paused' | 'completed' | 'game_over';
}

// Memoized wall component to reduce render overhead
const MemoizedWalls = memo(({ walls, color }: {
  walls: Wall[],
  color: string
}) => {
  return (
    <>
      {walls.map((wall, index) => (
        <MazeWall
          key={`wall-${index}`}
          wall={wall}
          index={index}
          color={color}
        />
      ))}
    </>
  );
});

// Memoized laser gates component to reduce render overhead
const MemoizedLaserGates = memo(({ laserGates, color, isActive }: {
  laserGates: LaserGate[],
  color: string,
  isActive: boolean
}) => {
  // Log the number of laser gates being rendered
  console.log(`Rendering ${laserGates.length} laser gates with isActive=${isActive}`);

  return (
    <>
      {laserGates.map((laserGate) => (
        <MazeLaserGate
          key={`laser-${laserGate.id}`}
          laserGate={laserGate}
          color={color}
          isActive={isActive}
        />
      ))}
    </>
  );
});

export const MazeElements: React.FC<MazeElementsProps> = memo(({
  maze,
  ballPositionX,
  ballPositionY,
  ballRadius,
  colors,
  gameState = 'playing',
}) => {
  // Define the base size of the maze coordinate system
  const mazeBaseSize = 300;

  return (
    <View style={[mazeRendererStyles.mazeElementsContainer, styles.centeredContainer]}>
      <Svg
         width="100%"
         height="100%"
         viewBox={`0 0 ${mazeBaseSize} ${mazeBaseSize}`}
      >
        <MazeGoal
          position={maze.endPosition}
          ballRadius={ballRadius}
          color={colors?.goal ?? '#4CAF50'}
        />

        <MemoizedWalls
          walls={maze.walls}
          color={colors?.walls ?? '#333333'}
        />

        {maze.laserGates && maze.laserGates.length > 0 ? (
          <>
            {console.log('Rendering laser gates:', maze.laserGates.length)}
            <MemoizedLaserGates
              laserGates={maze.laserGates}
              color={colors?.laser ?? '#FF0000'}
              isActive={gameState === 'playing'}
            />
          </>
        ) : (
          console.log('No laser gates found in maze')
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
}, (prevProps, nextProps) => {
  const mazeChanged = prevProps.maze.id !== nextProps.maze.id;
  const radiusChanged = prevProps.ballRadius !== nextProps.ballRadius;
  const gameStateChanged = prevProps.gameState !== nextProps.gameState;
  const colorsChanged =
    prevProps.colors?.goal !== nextProps.colors?.goal ||
    prevProps.colors?.walls !== nextProps.colors?.walls ||
    prevProps.colors?.ball !== nextProps.colors?.ball ||
    prevProps.colors?.laser !== nextProps.colors?.laser;

  return !(mazeChanged || radiusChanged || colorsChanged || gameStateChanged);
});

const styles = StyleSheet.create({
  centeredContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  mazeContent: {
    position: 'relative',
    width: 300,
    height: 300,
  },
});
