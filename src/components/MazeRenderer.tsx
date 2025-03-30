import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Maze, Position } from '../types';
import { MazeElements } from './maze/MazeElements';
import { mazeRendererStyles } from '../styles/MazeRendererStyles';

interface MazeRendererProps {
  maze: Maze;
  ballPosition: Position;
  ballRadius?: number;
  containerStyle?: object;
  paused?: boolean;
  scale?: number;
}

const MazeRenderer: React.FC<MazeRendererProps> = ({
  maze,
  ballPosition,
  ballRadius = 10,
  containerStyle = {},
  paused = false,
  scale = 1,
}) => {
  const { theme } = useTheme();
  const mazeSize = 300;
  
  const scaledSize = useMemo(() => mazeSize * scale, [mazeSize, scale]);
  const containerOffset = useMemo(() => ({
    x: (300 - scaledSize) / 2,
    y: (300 - scaledSize) / 2,
  }), [scaledSize]);

  const containerStyles = useMemo(() => [
    mazeRendererStyles.container,
    containerStyle,
    {
      backgroundColor: theme.surface,
      borderRadius: 12,
      overflow: 'hidden',
    },
  ], [containerStyle, theme.surface]);

  return (
    <View style={containerStyles}>
      <MazeElements
        maze={maze}
        ballPosition={ballPosition}
        ballRadius={ballRadius}
        scale={scale}
        paused={paused}
        theme={theme}
        centerOffset={containerOffset}
      />
    </View>
  );
};

export default memo(MazeRenderer, (prevProps, nextProps) => {
  const positionChanged = 
    prevProps.ballPosition.x !== nextProps.ballPosition.x || 
    prevProps.ballPosition.y !== nextProps.ballPosition.y;
  
  const mazeChanged = prevProps.maze.id !== nextProps.maze.id;
  const pausedChanged = prevProps.paused !== nextProps.paused;
  const scaleChanged = prevProps.scale !== nextProps.scale;
  const radiusChanged = prevProps.ballRadius !== nextProps.ballRadius;
  
  return !(positionChanged || mazeChanged || pausedChanged || scaleChanged || radiusChanged);
});
