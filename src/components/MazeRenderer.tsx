import React from 'react';
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
  const scaledSize = mazeSize * scale;
  const containerOffset = {
    x: (300 - scaledSize) / 2,
    y: (300 - scaledSize) / 2,
  };

  return (
    <View
      style={[
        mazeRendererStyles.container,
        containerStyle,
        {
          backgroundColor: theme.surface,
          borderRadius: 12,
          overflow: 'hidden',
        },
      ]}
    >
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

export default MazeRenderer;
