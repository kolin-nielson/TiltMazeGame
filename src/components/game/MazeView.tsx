import React from 'react';
import { View } from 'react-native';
import { Surface } from 'react-native-paper';
import { gameScreenStyles } from '../../styles/GameScreenStyles';
import MazeRenderer from '../MazeRenderer';
import { Maze, ThemeColors } from '../../types';
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
    <View style={gameScreenStyles.gameContainer}>
      <Surface
        style={[gameScreenStyles.mazeSurface, { backgroundColor: colors?.surface ?? '#fff' }]}
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
