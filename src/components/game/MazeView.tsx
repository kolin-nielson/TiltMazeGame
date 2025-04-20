import React from 'react';
import { View } from 'react-native';
import { Surface } from 'react-native-paper';
import MazeRenderer from '@components/maze/MazeRenderer';
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

const RENDER_SIZE = 300;

const MazeView: React.FC<MazeViewProps> = ({
  maze,
  ballPositionX,
  ballPositionY,
  ballRadius,
  colors,
  gameState,
}) => {
  return (
    <View style={{ width: RENDER_SIZE, height: RENDER_SIZE }}>
      <Surface
        style={{ flex: 1, backgroundColor: colors?.surface ?? '#fff', borderRadius: 12 }}
        elevation={4}
      >
        <MazeRenderer
          maze={maze}
          ballPositionX={ballPositionX}
          ballPositionY={ballPositionY}
          ballRadius={ballRadius}
          colors={colors}
          gameState={gameState}
        />
      </Surface>
    </View>
  );
};

export default React.memo(MazeView);
