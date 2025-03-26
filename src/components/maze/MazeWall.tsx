import React from 'react';
import { View } from 'react-native';
import { Surface } from 'react-native-paper';
import { Wall } from '../../types';
import { mazeRendererStyles } from '../../styles/MazeRendererStyles';

interface MazeWallProps {
  wall: Wall;
  index: number;
  scale: number;
  color: string;
}

export const MazeWall: React.FC<MazeWallProps> = ({ wall, index, scale, color }) => {
  return (
    <View
      style={[
        mazeRendererStyles.wall,
        {
          left: wall.x * scale,
          top: wall.y * scale,
          width: wall.width * scale,
          height: wall.height * scale,
        },
      ]}
    >
      <Surface
        key={`wall-${index}`}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: color,
          borderRadius: 2,
        }}
        elevation={3}
      >
        <></>
      </Surface>
    </View>
  );
};
