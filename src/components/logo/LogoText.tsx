import React from 'react';
import { Text as SvgText, TSpan } from 'react-native-svg';
import { ThemeColors } from '@types';
interface LogoTextProps {
  size: number;
  fontSize: number;
  colors: ThemeColors;
}
const LogoText: React.FC<LogoTextProps> = ({ size, fontSize, colors }) => (
  <SvgText
    x={size / 2}
    y={size * 1.15}
    fontSize={fontSize}
    fontWeight="bold"
    fontFamily="System"
    textAnchor="middle"
    fill={colors?.primary ?? '#6200ee'}
  >
    <TSpan dx={-fontSize * 0.05} dy={-fontSize * 0.05}>
      TILT
    </TSpan>
    <TSpan x={size / 2} dy={fontSize * 1.1} fill={colors?.secondary ?? '#03DAC6'}>
      MAZE
    </TSpan>
  </SvgText>
);
export default LogoText;
