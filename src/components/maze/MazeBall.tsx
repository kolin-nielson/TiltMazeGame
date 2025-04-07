import React, { memo } from 'react';
import { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MazeBallProps {
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  radius: number;
  color: string;
}

export const MazeBall: React.FC<MazeBallProps> = memo(({ ballPositionX, ballPositionY, radius, color }) => {
  const animatedProps = useAnimatedProps(() => {
    return {
      cx: ballPositionX.value,
      cy: ballPositionY.value,
    };
  });

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      r={radius}
      fill={color}
    />
  );
});
