import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import { useAppSelector, RootState } from '@store';
import { Maze, Position, ThemeColors } from '@types';
import { MazeElements } from '@components/maze/MazeElements';
import { mazeRendererStyles } from '@styles/MazeRendererStyles';
import Animated from 'react-native-reanimated';

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
  const themeColors = useAppSelector((state: RootState) => state.theme.colors);
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
      />
    </View>
  );
};

export default MazeRenderer;
