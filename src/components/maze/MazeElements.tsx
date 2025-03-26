import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Maze, Position } from '../../types';
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

export const MazeElements: React.FC<MazeElementsProps> = ({
  maze,
  ballPosition,
  ballRadius,
  scale,
  paused,
  theme,
  centerOffset = { x: 0, y: 0 },
}) => {
  const offset = 150 * (1 - scale);

  return (
    <View style={[mazeRendererStyles.mazeElementsContainer, styles.centeredContainer]}>
      <View
        style={[
          styles.mazeContent,
          { transform: [{ translateX: offset }, { translateY: offset }] },
        ]}
      >
        <MazeGoal
          position={maze.endPosition}
          scale={scale}
          ballRadius={ballRadius}
          color={theme.goal}
        />

        {maze.walls.map((wall, index) => (
          <MazeWall
            key={`wall-${index}`}
            wall={wall}
            index={index}
            scale={scale}
            color={theme.walls}
          />
        ))}

        {!paused && (
          <MazeBall position={ballPosition} radius={ballRadius} scale={scale} color={theme.ball} />
        )}
      </View>
    </View>
  );
};

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
