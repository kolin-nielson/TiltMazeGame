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
  
  // More dynamic and satisfying animations
  const outerScaleProps = useAnimatedProps(() => {
    const scale = Math.sin(anim.value * 2 * Math.PI) * 0.15 + 1;
    return { r: goalRadius * scale };
  });
  
  const innerScaleProps = useAnimatedProps(() => {
    const scale = Math.sin(anim.value * 2 * Math.PI + Math.PI) * 0.12 + 1;
    return { r: goalRadius * 0.6 * scale };
  });
  
  const pulseProps = useAnimatedProps(() => {
    const pulse = Math.sin(anim.value * 3 * Math.PI) * 0.25 + 0.75;
    return { r: goalRadius * 0.3 * pulse };
  });

  // Sparkle animations
  const sparkleProps1 = useAnimatedProps(() => {
    const sparkle = Math.sin(anim.value * 4 * Math.PI) * 0.4 + 0.6;
    return { r: goalRadius * 0.12 * sparkle };
  });

  const sparkleProps2 = useAnimatedProps(() => {
    const sparkle = Math.sin(anim.value * 3 * Math.PI + Math.PI/3) * 0.3 + 0.7;
    return { r: goalRadius * 0.08 * sparkle };
  });

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
      
      {/* Outer glow effect */}
      <AnimatedCircle
        animatedProps={useAnimatedProps(() => {
          const scale = Math.sin(anim.value * 2 * Math.PI) * 0.2 + 1;
          return { r: goalRadius * 1.2 * scale };
        })}
        cx={position.x}
        cy={position.y}
        fill="#86EFAC"
        opacity="0.3"
      />
      
      {/* Main goal ring with vibrant gradient */}
      <AnimatedCircle
        animatedProps={outerScaleProps}
        cx={position.x}
        cy={position.y}
        fill="url(#goal-gradient)"
        stroke="#FFFFFF"
        strokeWidth={4}
      />
      
      {/* Inner ring for depth */}
      <AnimatedCircle
        animatedProps={innerScaleProps}
        cx={position.x}
        cy={position.y}
        fill="url(#goal-inner-gradient)"
        stroke="#FFFFFF"
        strokeWidth={2}
        opacity="0.9"
      />
      
      {/* Pulsing center */}
      <AnimatedCircle
        animatedProps={pulseProps}
        cx={position.x}
        cy={position.y}
        fill="#FFFFFF"
      />
      
      {/* Sparkle effects for satisfaction */}
      <AnimatedCircle
        cx={position.x - goalRadius * 0.5}
        cy={position.y - goalRadius * 0.4}
        animatedProps={sparkleProps1}
        fill="#FFFFFF"
        opacity="0.9"
      />
      
      <AnimatedCircle
        cx={position.x + goalRadius * 0.4}
        cy={position.y - goalRadius * 0.3}
        animatedProps={sparkleProps2}
        fill="#FFFFFF"
        opacity="0.8"
      />
      
      <AnimatedCircle
        cx={position.x + goalRadius * 0.2}
        cy={position.y + goalRadius * 0.5}
        animatedProps={useAnimatedProps(() => {
          const sparkle = Math.sin(anim.value * 5 * Math.PI + Math.PI/2) * 0.3 + 0.7;
          return { r: goalRadius * 0.06 * sparkle };
        })}
        fill="#FFFFFF"
        opacity="0.7"
      />
      
      <AnimatedCircle
        cx={position.x - goalRadius * 0.3}
        cy={position.y + goalRadius * 0.3}
        animatedProps={useAnimatedProps(() => {
          const sparkle = Math.sin(anim.value * 4 * Math.PI + Math.PI) * 0.25 + 0.75;
          return { r: goalRadius * 0.05 * sparkle };
        })}
        fill="#FFFFFF"
        opacity="0.6"
      />
    </>
  );
};
