import React, { memo, useEffect } from 'react';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop, Pattern, Rect } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  withRepeat,
  Easing,
  useDerivedValue
} from 'react-native-reanimated';
import { useAppSelector } from '@store';
import { Trail } from '@store/slices/shopSlice';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
interface MazeBallProps {
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  radius: number;
}
export const MazeBall: React.FC<MazeBallProps> = memo(
  ({ ballPositionX, ballPositionY, radius }) => {
    const { skins, equippedSkin, trails, equippedTrail } = useAppSelector(state => state.shop);
    const skin = skins.find(s => s.id === equippedSkin);
    const trail = trails.find(t => t.id === equippedTrail);
    const defaultColor = '#E53935'; 
    const progress = useSharedValue(0);
    const pulseAnim = useSharedValue(0);
    const lastPositionX = useSharedValue(0);
    const lastPositionY = useSharedValue(0);
    useEffect(() => {
      lastPositionX.value = ballPositionX.value;
      lastPositionY.value = ballPositionY.value;
    }, []);
    const velocityX = useDerivedValue(() => {
      const dx = ballPositionX.value - lastPositionX.value;
      lastPositionX.value = ballPositionX.value;
      return dx;
    });
    const velocityY = useDerivedValue(() => {
      const dy = ballPositionY.value - lastPositionY.value;
      lastPositionY.value = ballPositionY.value;
      return dy;
    });
    const ballSpeed = useDerivedValue(() => {
      return Math.sqrt(velocityX.value * velocityX.value + velocityY.value * velocityY.value);
    });
    const shadowOffsetX = useDerivedValue(() => {
      return velocityX.value * 0.8;
    });
    const shadowOffsetY = useDerivedValue(() => {
      return velocityY.value * 0.8;
    });
    const dynamicScale = useDerivedValue(() => {
      const baseScale = 1.0;
      const speed = Math.sqrt(velocityX.value * velocityX.value + velocityY.value * velocityY.value);
      const directionFactor = speed > 0.1 ? 0.15 : 0;
      const xContribution = Math.abs(velocityX.value) / (speed + 0.01); 
      const yContribution = Math.abs(velocityY.value) / (speed + 0.01);
      const xScale = 1 - (Math.min(0.15, Math.abs(velocityX.value) * 0.015) * xContribution * directionFactor);
      const yScale = 1 - (Math.min(0.15, Math.abs(velocityY.value) * 0.015) * yContribution * directionFactor);
      return {
        x: xScale * baseScale,
        y: yScale * baseScale,
        speed: speed 
      };
    });
    const animatedProps = useAnimatedProps(() => {
      return {
        cx: ballPositionX.value,
        cy: ballPositionY.value,
      };
    });
    const shadowProps = useAnimatedProps(() => {
      const speed = dynamicScale.value.speed || 0;
      const offsetX = shadowOffsetX.value;
      const offsetY = shadowOffsetY.value;
      const baseOpacity = 0.25;
      const speedContribution = Math.min(0.2, speed * 0.05);
      const opacity = baseOpacity + speedContribution;
      const sizeMultiplier = 1.02 + Math.min(0.08, speed * 0.01);
      return {
        cx: ballPositionX.value + offsetX,
        cy: ballPositionY.value + offsetY + 1.5, 
        r: radius * sizeMultiplier,
        opacity: opacity,
      };
    });
    const glowProps = useAnimatedProps(() => {
      const speed = dynamicScale.value.speed || 0;
      const speedGlow = Math.min(0.15, speed * 0.03);
      const pulseEffect = pulseAnim.value * 0.1;
      const opacity = 0.25 + pulseEffect + speedGlow;
      const sizeMultiplier = 1.1 + pulseAnim.value * 0.05 + Math.min(0.1, speed * 0.01);
      return {
        cx: ballPositionX.value,
        cy: ballPositionY.value,
        opacity: opacity,
        r: radius * sizeMultiplier
      };
    });
    const scaleXProps = useAnimatedProps(() => {
      const angle = Math.atan2(velocityY.value, velocityX.value);
      const speed = dynamicScale.value.speed || 0;
      const rotationEffect = speed > 0.5 ? Math.sin(angle) * 0.1 : 0;
      const sizeVariation = 1 - Math.min(0.05, speed * 0.005);
      return {
        r: radius * sizeVariation, 
        cx: ballPositionX.value,
        cy: ballPositionY.value,
      };
    });
    useEffect(() => {
      progress.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
      pulseAnim.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    }, []);
    const getLinearGradientProps = (skin: any) => {
      if (!skin?.animated) {
        return { x1: "0%", y1: "0%", x2: "100%", y2: "100%" };
      } else {
        return { x1: "0%", y1: "0%", x2: "100%", y2: "100%" };
      }
    };
    const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
    const animatedGradientProps = useAnimatedProps(() => {
      if (!skin?.animated) {
        return {
          x1: "0%",
          y1: "0%",
          x2: "100%",
          y2: "100%"
        };
      }
      return {
        x1: `${interpolate(progress.value, [0, 1], [0, 100])}%`,
        y1: `${interpolate(progress.value, [0, 1], [0, 100])}%`,
        x2: `${interpolate(progress.value, [0, 1], [100, 0])}%`,
        y2: `${interpolate(progress.value, [0, 1], [100, 0])}%`
      };
    });
    const renderFill = () => {
      if (!skin) return defaultColor;
      if (skin.animated && skin.type === 'gradient'){
        return `url(#${gradientId})`;
      }
      switch (skin.type) {
        case 'gradient': return `url(#${gradientId})`;
        case 'pattern': return `url(#${patternId})`;
        case 'solid':
        default: return skin.colors[0];
      }
    };
    const gradientId = React.useMemo(() => `ball-grad-${skin?.id || 'default'}`, [skin?.id]);
    const patternId = React.useMemo(() => `ball-pattern-${skin?.id || 'default'}`, [skin?.id]);
    const trailPositions = useSharedValue<{x: number, y: number, time: number}[]>([]);
    useDerivedValue(() => {
      const now = Date.now();
      const speed = dynamicScale.value.speed || 0;
      if (speed > 0.05) { 
        trailPositions.value = [
          {
            x: ballPositionX.value,
            y: ballPositionY.value,
            time: now
          },
          ...trailPositions.value
        ].slice(0, 10); 
      }
      trailPositions.value = trailPositions.value.filter(
        point => now - point.time < 500
      );
    });
    const generateTrailProps = (index: number) => {
      return useAnimatedProps(() => {
        if (trailPositions.value.length <= index) {
          return {
            cx: 0,
            cy: 0,
            r: 0,
            opacity: 0
          };
        }
        const point = trailPositions.value[index];
        const now = Date.now();
        const age = now - point.time;
        const speed = dynamicScale.value.speed || 0;
        const baseTrailOpacity = 0.15; 
        const speedContribution = Math.min(0.35, speed * 0.05); 
        const maxOpacity = baseTrailOpacity + speedContribution; 
        const opacity = maxOpacity * (1 - (age / 500)); 
        const size = radius * (0.8 - (index * 0.10)); 
        return {
          cx: point.x,
          cy: point.y,
          r: size,
          opacity: opacity
        };
      });
    };
    const trailProps1 = generateTrailProps(0);
    const trailProps2 = generateTrailProps(1);
    const trailProps3 = generateTrailProps(2);
    const trailProps4 = generateTrailProps(3);
    const trailProps5 = generateTrailProps(4);
    return (
      <>
        <Defs>
          {skin?.type === 'gradient' && (
            skin.gradientDirection === 'radial' ? (
              <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                {skin.colors.map((c, index) => (
                  <Stop key={index} offset={`${(index / (skin.colors.length - 1)) * 100}%`} stopColor={c} />
                ))}
              </RadialGradient>
            ) : (
              skin.animated ? (
                <AnimatedLinearGradient
                  id={gradientId}
                  animatedProps={animatedGradientProps}
                >
                  {skin.colors.map((c, index) => (
                    <Stop key={index} offset={`${(index / (skin.colors.length - 1)) * 100}%`} stopColor={c} />
                  ))}
                </AnimatedLinearGradient>
              ) : (
                <LinearGradient
                  id={gradientId}
                  {...getLinearGradientProps(skin)}
                >
                  {skin.colors.map((c, index) => (
                    <Stop key={index} offset={`${(index / (skin.colors.length - 1)) * 100}%`} stopColor={c} />
                  ))}
                </LinearGradient>
              )
            )
          )}
          {skin?.type === 'pattern' && skin.patternType === 'dots' && (
            <Pattern id={patternId} patternUnits="userSpaceOnUse" width="10" height="10">
              <Rect width="10" height="10" fill={skin.colors[0]} />
              <Circle cx="5" cy="5" r="2" fill={skin.colors[1]} />
            </Pattern>
          )}
          {skin?.type === 'pattern' && skin.patternType === 'stripes' && (
            <Pattern id={patternId} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
              <Rect width="10" height="10" fill={skin.colors[0]} />
              <Rect width="5" height="10" fill={skin.colors[1]} />
            </Pattern>
          )}
        </Defs>
        {}
        <AnimatedCircle
          animatedProps={trailProps5}
          fill={trail && trail.colors.length > 0 ? trail.colors[0] : (skin?.type === 'solid' ? skin.colors[0] : 'transparent')}
        />
        <AnimatedCircle
          animatedProps={trailProps4}
          fill={trail && trail.colors.length > 0 ? trail.colors[0] : (skin?.type === 'solid' ? skin.colors[0] : 'transparent')}
        />
        <AnimatedCircle
          animatedProps={trailProps3}
          fill={trail && trail.colors.length > 0 ? trail.colors[0] : (skin?.type === 'solid' ? skin.colors[0] : 'transparent')}
        />
        <AnimatedCircle
          animatedProps={trailProps2}
          fill={trail && trail.colors.length > 0 ? trail.colors[0] : (skin?.type === 'solid' ? skin.colors[0] : 'transparent')}
        />
        <AnimatedCircle
          animatedProps={trailProps1}
          fill={trail && trail.colors.length > 0 ? trail.colors[0] : (skin?.type === 'solid' ? skin.colors[0] : 'transparent')}
        />
        {}
        <AnimatedCircle
          animatedProps={shadowProps}
          fill="rgba(0,0,0,0.3)"
        />
        {}
        <AnimatedCircle
          animatedProps={glowProps}
          fill="rgba(255,255,255,0.2)"
        />
        {}
        <AnimatedCircle
          animatedProps={scaleXProps}
          fill={renderFill()}
        />
        {}
        <AnimatedCircle
          animatedProps={useAnimatedProps(() => {
            const speed = dynamicScale.value.speed || 0;
            const offsetX = -radius * 0.3 + (velocityX.value * 0.02);
            const offsetY = -radius * 0.3 + (velocityY.value * 0.02);
            const highlightSize = radius * (0.3 - Math.min(0.1, speed * 0.01));
            return {
              cx: ballPositionX.value + offsetX,
              cy: ballPositionY.value + offsetY,
              r: highlightSize,
              opacity: 0.25 - Math.min(0.1, speed * 0.02) 
            };
          })}
          fill="rgba(255,255,255,0.25)"
        />
      </>
    );
  }
);
MazeBall.displayName = 'MazeBall';
