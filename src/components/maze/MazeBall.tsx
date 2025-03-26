import React from 'react';
import { View } from 'react-native';
import { Surface } from 'react-native-paper';
import { Position } from '../../types';
import { mazeRendererStyles } from '../../styles/MazeRendererStyles';

interface MazeBallProps {
  position: Position;
  radius: number;
  scale: number;
  color: string;
}

export const MazeBall: React.FC<MazeBallProps> = ({ position, radius, scale, color }) => {
  const scaledRadius = radius * scale;

  return (
    <View
      style={[
        mazeRendererStyles.ball,
        {
          left: (position.x - scaledRadius) * scale,
          top: (position.y - scaledRadius) * scale,
          width: scaledRadius * 2,
          height: scaledRadius * 2,
        },
      ]}
    >
      <Surface
        style={{
          width: '100%',
          height: '100%',
          borderRadius: scaledRadius,
          backgroundColor: color,
        }}
        elevation={4}
      >
        <></>
      </Surface>
    </View>
  );
};
