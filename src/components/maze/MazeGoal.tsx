import React from 'react';
import { View } from 'react-native';
import { Surface } from 'react-native-paper';
import { Position } from '../../types';
import { mazeRendererStyles } from '../../styles/MazeRendererStyles';

interface MazeGoalProps {
  position: Position;
  scale: number;
  ballRadius: number;
  color: string;
}

export const MazeGoal: React.FC<MazeGoalProps> = ({ position, scale, ballRadius, color }) => {
  return (
    <View
      style={[
        mazeRendererStyles.goal,
        {
          left: (position.x - ballRadius * 1.5) * scale,
          top: (position.y - ballRadius * 1.5) * scale,
          width: ballRadius * 3 * scale,
          height: ballRadius * 3 * scale,
        },
      ]}
    >
      <Surface
        style={{
          width: '100%',
          height: '100%',
          borderRadius: ballRadius * 1.5 * scale,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.8)',
        }}
        elevation={2}
      >
        <></>
      </Surface>
    </View>
  );
};
