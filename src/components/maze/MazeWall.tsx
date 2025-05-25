import React from 'react';
import { Rect } from 'react-native-svg';
import { Wall } from '@types';

interface MazeWallProps {
  wall: Wall;
  index: number;
  color: string;
}

export const MazeWall: React.FC<MazeWallProps> = ({ wall, index, color }) => {
  return (
    <Rect
      key={`wall-${index}`}
      x={wall.x}
      y={wall.y}
      width={wall.width}
      height={wall.height}
      fill={color}
      // Remove all stroke properties for clean rendering
      shapeRendering="crispEdges" // Ensures pixel-perfect edges
    />
  );
};
