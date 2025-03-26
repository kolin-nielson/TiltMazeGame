import React from 'react';
import { Circle, Rect } from 'react-native-svg';

interface LogoBackgroundProps {
  size: number;
  shadowOffset: number;
}

const LogoBackground: React.FC<LogoBackgroundProps> = ({ size, shadowOffset }) => {
  return (
    <>
      <Circle
        cx={size * 0.5 + shadowOffset}
        cy={size * 0.5 + shadowOffset * 2}
        r={size * 0.44}
        fill="url(#shadowGradient)"
      />

      <Rect
        x={size * 0.1}
        y={size * 0.1}
        width={size * 0.8}
        height={size * 0.8}
        rx={size * 0.08}
        ry={size * 0.08}
        fill="url(#bgGradient)"
        stroke="url(#primaryGradient)"
        strokeWidth={size * 0.015}
      />

      <Rect
        x={size * 0.1}
        y={size * 0.1}
        width={size * 0.8}
        height={size * 0.8}
        rx={size * 0.08}
        ry={size * 0.08}
        fill="url(#mazePattern)"
        clipPath="url(#mazeClip)"
      />
    </>
  );
};

export default LogoBackground;
