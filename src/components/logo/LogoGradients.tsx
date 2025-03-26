import React from 'react';
import {
  LinearGradient,
  RadialGradient,
  Stop,
  Pattern,
  Path,
  ClipPath,
  Mask,
  Rect,
} from 'react-native-svg';
import { Theme } from '../../types/Theme';
import { shadeColor } from '../../utils/colorUtils';

interface LogoGradientsProps {
  theme: Theme;
  size: number;
}

const LogoGradients: React.FC<LogoGradientsProps> = ({ theme, size }) => {
  return (
    <>
      <LinearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={shadeColor(theme.primary, 20)} stopOpacity="1" />
        <Stop offset="100%" stopColor={shadeColor(theme.primary, -20)} stopOpacity="1" />
      </LinearGradient>

      <LinearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={theme.secondary} stopOpacity="1" />
        <Stop offset="100%" stopColor={shadeColor(theme.secondary, -30)} stopOpacity="1" />
      </LinearGradient>

      <RadialGradient id="ballGradient" cx="40%" cy="40%" r="60%" fx="25%" fy="25%">
        <Stop offset="0%" stopColor={shadeColor(theme.ball, 40)} stopOpacity="1" />
        <Stop offset="80%" stopColor={theme.ball} stopOpacity="1" />
        <Stop offset="100%" stopColor={shadeColor(theme.ball, -30)} stopOpacity="1" />
      </RadialGradient>

      <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={shadeColor(theme.background, 5)} stopOpacity="1" />
        <Stop offset="100%" stopColor={shadeColor(theme.background, -10)} stopOpacity="1" />
      </LinearGradient>

      <RadialGradient id="shadowGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <Stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
        <Stop offset="70%" stopColor="#000000" stopOpacity="0.1" />
        <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </RadialGradient>

      <LinearGradient id="wallGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor={shadeColor(theme.walls, 15)} stopOpacity="1" />
        <Stop offset="50%" stopColor={theme.walls} stopOpacity="1" />
        <Stop offset="100%" stopColor={shadeColor(theme.walls, -15)} stopOpacity="1" />
      </LinearGradient>

      <LinearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={theme.goal} stopOpacity="1" />
        <Stop offset="100%" stopColor={shadeColor(theme.goal, -30)} stopOpacity="1" />
      </LinearGradient>

      <Mask id="mazeMask">
        <Rect x="0" y="0" width={size} height={size} fill="white" />
      </Mask>

      <ClipPath id="mazeClip">
        <Rect
          x={size * 0.1}
          y={size * 0.1}
          width={size * 0.8}
          height={size * 0.8}
          rx={size * 0.08}
          ry={size * 0.08}
        />
      </ClipPath>

      <Pattern
        id="mazePattern"
        patternUnits="userSpaceOnUse"
        width={size * 0.2}
        height={size * 0.2}
        patternTransform="rotate(45)"
      >
        <Path
          d={`M 0 0 L ${size * 0.2} 0 L ${size * 0.2} ${size * 0.2} L 0 ${size * 0.2} Z`}
          fill="none"
          stroke={shadeColor(theme.primary, -40)}
          strokeWidth="1"
          strokeOpacity="0.1"
        />
      </Pattern>
    </>
  );
};

export default LogoGradients;
