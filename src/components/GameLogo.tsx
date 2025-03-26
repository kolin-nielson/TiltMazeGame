import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import LogoGradients from './logo/LogoGradients';
import LogoBackground from './logo/LogoBackground';
import MazeElements from './logo/MazeElements';
import LogoText from './logo/LogoText';

interface GameLogoProps {
  size?: number;
  showText?: boolean;
  animated?: boolean;
}

const GameLogo: React.FC<GameLogoProps> = ({ size = 120, showText = true, animated = false }) => {
  const { theme } = useTheme();
  const ballSize = size * 0.1;
  const wallThickness = size * 0.045;
  const fontSize = size * 0.16;
  const shadowOffset = size * 0.015;

  return (
    <View style={styles.container}>
      <Svg
        width={size}
        height={showText ? size * 1.3 : size}
        viewBox={`0 0 ${size} ${showText ? size * 1.3 : size}`}
      >
        <Defs>
          <LogoGradients theme={theme} size={size} />
        </Defs>

        <LogoBackground size={size} shadowOffset={shadowOffset} />

        <MazeElements size={size} ballSize={ballSize} wallThickness={wallThickness} />

        {showText && <LogoText size={size} fontSize={fontSize} theme={theme} />}
      </Svg>
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
