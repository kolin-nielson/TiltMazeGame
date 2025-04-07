import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg from 'react-native-svg';
import { Maze, Position, Wall } from '../../types';
import { MazeWall } from './MazeWall';
import { MazeGoal } from './MazeGoal';
import { MazeBall } from './MazeBall';
import { mazeRendererStyles } from '../../styles/MazeRendererStyles';
import { ThemeColors } from '../../types';
import Animated from 'react-native-reanimated';

interface MazeElementsProps {
  maze: Maze;
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  ballRadius: number;
  colors: ThemeColors;
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
  ballPositionX,
  ballPositionY,
  ballRadius,
  colors,
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
  const colorsChanged = 
    prevProps.colors?.goal !== nextProps.colors?.goal ||
    prevProps.colors?.walls !== nextProps.colors?.walls ||
    prevProps.colors?.ball !== nextProps.colors?.ball;

  return !(mazeChanged || radiusChanged || colorsChanged);
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
