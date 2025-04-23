import React from 'react';
import { View } from 'react-native';
import { Surface } from 'react-native-paper';
import MazeElements from '@components/maze/MazeElements';
import { Maze, ThemeColors } from '@types';
import Animated from 'react-native-reanimated';

interface MazeViewProps {
  maze: Maze;
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  ballRadius: number;
  colors: ThemeColors;
  gameState: string;
}

const MazeView: React.FC<MazeViewProps> = ({
  maze,
  ballPositionX,
  ballPositionY,
  ballRadius,
  colors,
  gameState,
}) => {
  return (
      <Surface
      style={{ width: '100%', height: '100%', backgroundColor: colors?.surface ?? '#fff', borderRadius: 12 }}
        elevation={4}
      >
        <MazeElements
          maze={maze}
          ballPositionX={ballPositionX}
          ballPositionY={ballPositionY}
          ballRadius={ballRadius}
          colors={colors}
          gameState={gameState}
        />
      </Surface>
  );
};

export default React.memo(MazeView);
