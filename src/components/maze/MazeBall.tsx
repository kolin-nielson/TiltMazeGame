import React, { memo } from 'react';
import { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { useAppSelector } from '@store';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MazeBallProps {
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  radius: number;
  color: string;
}

export const MazeBall: React.FC<MazeBallProps> = memo(
  ({ ballPositionX, ballPositionY, radius, color }) => {
    // Get equipped skin color from shop state
    const { skins, equippedSkin } = useAppSelector(state => state.shop);
    const skin = skins.find(s => s.id === equippedSkin);
    const ballColor = skin?.color || color;
    
    const animatedProps = useAnimatedProps(() => {
      return {
        cx: ballPositionX.value,
        cy: ballPositionY.value,
      };
    });

    return <AnimatedCircle animatedProps={animatedProps} r={radius} fill={ballColor} />;
  }
);

MazeBall.displayName = 'MazeBall';
