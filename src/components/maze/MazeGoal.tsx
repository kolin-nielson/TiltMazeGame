import React from 'react';
import { Circle } from 'react-native-svg';
import { Position } from '@types';

interface MazeGoalProps {
  position: Position;
  ballRadius: number;
}

export const MazeGoal: React.FC<MazeGoalProps> = ({ position, ballRadius }) => {
  const goalRadius = ballRadius * 1.5;
  return <Circle cx={position.x} cy={position.y} r={goalRadius} fill="#4CAF50" />;
};
