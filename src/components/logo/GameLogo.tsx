import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Circle, Text as SvgText, G } from 'react-native-svg';
import { useAppSelector, RootState } from '@store';

interface GameLogoProps {
  size?: number;
  showText?: boolean;
}

const GameLogo: React.FC<GameLogoProps> = ({ size = 120, showText = true }) => {
  const colors = useAppSelector((state: RootState) => state.theme.colors);

  const baseSize = 100;
  const scale = size / baseSize;
  const strokeWidth = 4 * scale;
  const tiltAngle = -15;

  const rectSize = baseSize * 0.8;
  const rectOriginX = (baseSize - rectSize) / 2;
  const rectOriginY = (baseSize - rectSize) / 2;

  const textYOffset = baseSize * 1.1;
  const totalHeight = showText ? textYOffset + baseSize * 0.18 : baseSize;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${baseSize} ${baseSize}`}>
        <G transform={`rotate(${tiltAngle}, ${baseSize / 2}, ${baseSize / 2})`}>
          <Rect
            x={rectOriginX}
            y={rectOriginY}
            width={rectSize}
            height={rectSize}
            rx={8 * scale}
            fill={colors?.primaryContainer ?? '#E9DDFF'}
          />
          <Path
            d={`M ${rectOriginX + rectSize * 0.2},${rectOriginY + rectSize * 0.2}
               L ${rectOriginX + rectSize * 0.8},${rectOriginY + rectSize * 0.2}
               L ${rectOriginX + rectSize * 0.8},${rectOriginY + rectSize * 0.6}
               L ${rectOriginX + rectSize * 0.4},${rectOriginY + rectSize * 0.6}
               L ${rectOriginX + rectSize * 0.4},${rectOriginY + rectSize * 0.8}`}
            stroke={colors?.primary ?? '#6200EE'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Circle
            cx={rectOriginX + rectSize * 0.7}
            cy={rectOriginY + rectSize * 0.7}
            r={strokeWidth * 1.2}
            fill={colors?.secondary ?? '#03DAC6'}
          />
        </G>
      </Svg>

      {showText && (
        <Svg
          width={size}
          height={size * 0.3}
          viewBox={`0 0 ${baseSize} ${baseSize * 0.3}`}
          style={{ marginTop: size * 0.05 }}
        >
          <SvgText
            x={baseSize / 2}
            y={baseSize * 0.15}
            fontSize={baseSize * 0.15}
            fontWeight="600"
            fontFamily="System"
            textAnchor="middle"
            fill={colors?.primary ?? '#6200EE'}
          >
            THE TILT MAZE
          </SvgText>
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GameLogo;
