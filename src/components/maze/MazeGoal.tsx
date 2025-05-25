import React, { useEffect } from 'react';
import { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Position, ThemeColors } from '@types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MazeGoalProps {
  position: Position;
  ballRadius: number;
  colors: ThemeColors;
}

export const MazeGoal: React.FC<MazeGoalProps> = ({ position, ballRadius, colors }) => {
  const anim = useSharedValue(0);
  
  useEffect(() => {
    anim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const goalRadius = ballRadius * 1.5;

  return (
    <>
      <Defs>
        <RadialGradient id="goal-gradient" cx="50%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="#DCFCE7" stopOpacity="1" />
          <Stop offset="30%" stopColor="#34D399" stopOpacity="1" />
          <Stop offset="70%" stopColor="#10B981" stopOpacity="1" />
          <Stop offset="100%" stopColor="#059669" stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id="goal-inner-gradient" cx="50%" cy="30%" r="60%">
          <Stop offset="0%" stopColor="#F0FDF4" stopOpacity="1" />
          <Stop offset="50%" stopColor="#86EFAC" stopOpacity="1" />
          <Stop offset="100%" stopColor="#22C55E" stopOpacity="1" />
        </RadialGradient>
      </Defs>
      
      {/* Static outer glow for performance */}
      <AnimatedCircle
        cx={position.x}
        cy={position.y}
        r={goalRadius * 1.15}
        fill="#86EFAC"
        opacity="0.25"
      />
      
      {/* Main goal ring with optimized animation */}
      <AnimatedCircle
        animatedProps={useAnimatedProps(() => {
          const outerScale = Math.sin(anim.value * 2 * Math.PI) * 0.15 + 1;
          return { r: goalRadius * outerScale };
        })}
        cx={position.x}
        cy={position.y}
        fill="url(#goal-gradient)"
        stroke="#FFFFFF"
        strokeWidth={4}
      />
      
      {/* Inner ring with shared animation calculation */}
      <AnimatedCircle
        animatedProps={useAnimatedProps(() => {
          const innerScale = Math.sin(anim.value * 2 * Math.PI + Math.PI) * 0.12 + 1;
          return { r: goalRadius * 0.6 * innerScale };
        })}
        cx={position.x}
        cy={position.y}
        fill="url(#goal-inner-gradient)"
        stroke="#FFFFFF"
        strokeWidth={2}
        opacity="0.9"
      />
      
      {/* Pulsing center with shared calculation */}
      <AnimatedCircle
        animatedProps={useAnimatedProps(() => {
          const pulse = Math.sin(anim.value * 3 * Math.PI) * 0.25 + 0.75;
          return { r: goalRadius * 0.3 * pulse };
        })}
        cx={position.x}
        cy={position.y}
        fill="#FFFFFF"
      />
      
      {/* Only 2 optimized sparkles for performance */}
      <AnimatedCircle
        cx={position.x - goalRadius * 0.5}
        cy={position.y - goalRadius * 0.4}
        animatedProps={useAnimatedProps(() => {
          const sparkle1 = Math.sin(anim.value * 4 * Math.PI) * 0.4 + 0.6;
          return { r: goalRadius * 0.12 * sparkle1 };
        })}
        fill="#FFFFFF"
        opacity="0.9"
      />
      
      <AnimatedCircle
        cx={position.x + goalRadius * 0.4}
        cy={position.y - goalRadius * 0.3}
        animatedProps={useAnimatedProps(() => {
          const sparkle2 = Math.sin(anim.value * 3 * Math.PI + Math.PI/3) * 0.3 + 0.7;
          return { r: goalRadius * 0.08 * sparkle2 };
        })}
        fill="#FFFFFF"
        opacity="0.8"
      />
    </>
  );
};
