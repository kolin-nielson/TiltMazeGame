import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Maze, Position, Wall } from '../../types';
import { MazeWall } from './MazeWall';
import { MazeGoal } from './MazeGoal';
import { MazeBall } from './MazeBall';
import { mazeRendererStyles } from '../../styles/MazeRendererStyles';
import { ThemeColors } from '../../types';

interface MazeElementsProps {
  maze: Maze;
  ballPosition: Position;
  ballRadius: number;
  scale: number;
  paused: boolean;
  theme: ThemeColors;
  centerOffset?: { x: number; y: number };
}

// Memoized wall component to reduce render overhead
const MemoizedWalls = memo(({ walls, scale, color }: { 
  walls: Wall[], 
  scale: number, 
  color: string 
}) => {
  return (
    <>
      {walls.map((wall, index) => (
        <MazeWall
          key={`wall-${index}`}
          wall={wall}
          index={index}
          scale={scale}
          color={color}
        />
      ))}
    </>
  );
});

export const MazeElements: React.FC<MazeElementsProps> = memo(({
  maze,
  ballPosition,
  ballRadius,
  scale,
  paused,
  theme,
  centerOffset = { x: 0, y: 0 },
}) => {
  // Memoize the offset calculation
  const offset = useMemo(() => 150 * (1 - scale), [scale]);

  // Memoize the transform style to prevent object recreation on each render
  const transformStyle = useMemo(() => ({
    transform: [{ translateX: offset }, { translateY: offset }]
  }), [offset]);

  return (
    <View style={[mazeRendererStyles.mazeElementsContainer, styles.centeredContainer]}>
      <View style={[styles.mazeContent, transformStyle]}>
        <MazeGoal
          position={maze.endPosition}
          scale={scale}
          ballRadius={ballRadius}
          color={theme.goal}
        />

        <MemoizedWalls 
          walls={maze.walls}
          scale={scale}
          color={theme.walls}
        />

        {!paused && (
          <MazeBall position={ballPosition} radius={ballRadius} scale={scale} color={theme.ball} />
        )}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Only re-render when necessary props change
  const ballChanged = 
    prevProps.ballPosition.x !== nextProps.ballPosition.x || 
    prevProps.ballPosition.y !== nextProps.ballPosition.y;
  
  const mazeChanged = prevProps.maze.id !== nextProps.maze.id;
  const themeChanged = prevProps.theme !== nextProps.theme;
  const pausedChanged = prevProps.paused !== nextProps.paused;
  const scaleChanged = prevProps.scale !== nextProps.scale;
  
  // Return true if nothing changed (skip re-render)
  return !(ballChanged || mazeChanged || themeChanged || pausedChanged || scaleChanged);
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
