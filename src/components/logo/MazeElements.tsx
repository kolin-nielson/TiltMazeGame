import React from 'react';
import { G, Rect, Circle } from 'react-native-svg';
interface MazeElementsProps {
  size: number;
  ballSize: number;
  wallThickness: number;
}
const MazeElements: React.FC<MazeElementsProps> = ({ size, ballSize, wallThickness }) => {
  return (
    <>
      <G>
        <Rect
          x={size * 0.25}
          y={size * 0.25}
          width={size * 0.25}
          height={wallThickness}
          fill="url(#wallGradient)"
          rx={wallThickness / 2}
          ry={wallThickness / 2}
        />
        <Rect
          x={size * 0.25}
          y={size * 0.25}
          width={wallThickness}
          height={size * 0.25}
          fill="url(#wallGradient)"
          rx={wallThickness / 2}
          ry={wallThickness / 2}
        />
        <Rect
          x={size * 0.5}
          y={size * 0.25}
          width={size * 0.25}
          height={wallThickness}
          fill="url(#wallGradient)"
          rx={wallThickness / 2}
          ry={wallThickness / 2}
        />
        <Rect
          x={size * 0.75 - wallThickness / 2}
          y={size * 0.25}
          width={wallThickness}
          height={size * 0.25}
          fill="url(#wallGradient)"
          rx={wallThickness / 2}
          ry={wallThickness / 2}
        />
        <Rect
          x={size * 0.35}
          y={size * 0.5 - wallThickness / 2}
          width={size * 0.3}
          height={wallThickness}
          fill="url(#wallGradient)"
          rx={wallThickness / 2}
          ry={wallThickness / 2}
        />
        <Rect
          x={size * 0.35}
          y={size * 0.5}
          width={wallThickness}
          height={size * 0.15}
          fill="url(#wallGradient)"
          rx={wallThickness / 2}
          ry={wallThickness / 2}
        />
        <Rect
          x={size * 0.35}
          y={size * 0.65}
          width={size * 0.4}
          height={wallThickness}
          fill="url(#wallGradient)"
          rx={wallThickness / 2}
          ry={wallThickness / 2}
        />
      </G>
      <Circle
        cx={size * 0.75}
        cy={size * 0.75}
        r={ballSize * 1.5}
        fill="none"
        stroke="url(#goalGradient)"
        strokeWidth={wallThickness * 0.5}
        strokeDasharray={[wallThickness * 0.6, wallThickness * 0.4]}
      />
      <Circle
        cx={size * 0.75}
        cy={size * 0.75}
        r={ballSize * 0.3}
        fill="url(#goalGradient)"
        opacity={0.7}
      />
      <Circle cx={size * 0.3} cy={size * 0.35} r={ballSize} fill="url(#ballGradient)" />
      <Circle
        cx={size * 0.3 - ballSize * 0.3}
        cy={size * 0.35 - ballSize * 0.3}
        r={ballSize * 0.4}
        fill="white"
        opacity={0.3}
      />
    </>
  );
};
export default MazeElements;
