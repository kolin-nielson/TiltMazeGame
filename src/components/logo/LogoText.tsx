import React from 'react';
import { Text } from 'react-native-svg';
import { Theme } from '../../types/Theme';

interface LogoTextProps {
  size: number;
  fontSize: number;
  theme: Theme;
}

const LogoText: React.FC<LogoTextProps> = ({ size, fontSize, theme }) => {
  return (
    <>
      <Text
        x={size / 2}
        y={size + fontSize * 0.8}
        fontSize={fontSize}
        fontWeight="bold"
        fill="url(#primaryGradient)"
        textAnchor="middle"
      >
        TILT MAZE
      </Text>

      <Text
        x={size / 2 + 2}
        y={size + fontSize * 0.8 + 2}
        fontSize={fontSize}
        fontWeight="bold"
        fill="rgba(0,0,0,0.15)"
        textAnchor="middle"
        opacity={0.4}
      >
        TILT MAZE
      </Text>

      <Text
        x={size / 2}
        y={size + fontSize * 1.8}
        fontSize={fontSize * 0.5}
        fontWeight="500"
        letterSpacing={size * 0.008}
        fill={theme.text}
        textAnchor="middle"
      >
        CHALLENGE
      </Text>
    </>
  );
};

export default LogoText;
