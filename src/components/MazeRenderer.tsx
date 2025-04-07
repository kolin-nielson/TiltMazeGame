import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Maze, Position } from '../types';
import { MazeElements } from './maze/MazeElements';
import { mazeRendererStyles } from '../styles/MazeRendererStyles';
import Animated from 'react-native-reanimated';

interface MazeRendererProps {
  maze: Maze;
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  ballRadius?: number;
  containerStyle?: object;
  colors: ThemeColors;
}

const MazeRenderer: React.FC<MazeRendererProps> = ({
  maze,
  ballPositionX,
  ballPositionY,
  ballRadius = 7,
  containerStyle = {},
  colors,
}) => {
  const { theme, colors: themeColors } = useTheme();
  const mazeSize = 300;
  
  const containerStyles = useMemo(() => [
    mazeRendererStyles.container,
    containerStyle,
    {
      backgroundColor: themeColors?.surface ?? '#ffffff',
      borderRadius: 12,
      overflow: 'hidden',
    },
  ], [containerStyle, themeColors?.surface]);

  return (
    <View style={containerStyles}>
      <MazeElements
        maze={maze}
        ballPositionX={ballPositionX}
        ballPositionY={ballPositionY}
        ballRadius={ballRadius}
        colors={colors}
      />
    </View>
  );
};

export default memo(MazeRenderer, (prevProps, nextProps) => {
  const mazeChanged = prevProps.maze.id !== nextProps.maze.id;
  const radiusChanged = prevProps.ballRadius !== nextProps.ballRadius;
  const colorsChanged = 
    prevProps.colors?.surface !== nextProps.colors?.surface ||
    prevProps.colors?.walls !== nextProps.colors?.walls ||
    prevProps.colors?.ball !== nextProps.colors?.ball ||
    prevProps.colors?.goal !== nextProps.colors?.goal;

  return !(mazeChanged || radiusChanged || colorsChanged);
});
