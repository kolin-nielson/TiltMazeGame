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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MazeBallProps {
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  radius: number;
}

export const MazeBall: React.FC<MazeBallProps> = memo(
  ({ ballPositionX, ballPositionY, radius }) => {
    const { skins, equippedSkin } = useAppSelector(state => state.shop);
    const skin = skins.find(s => s.id === equippedSkin);
    const defaultColor = '#E53935'; // Classic Red default color

    const progress = useSharedValue(0);
    const pulseAnim = useSharedValue(0);

    // Track last positions to create trailing effect and calculate velocity
    // Initialize with 0 to avoid accessing .value during render
    const lastPositionX = useSharedValue(0);
    const lastPositionY = useSharedValue(0);
    
    // Set initial values after render
    useEffect(() => {
      lastPositionX.value = ballPositionX.value;
      lastPositionY.value = ballPositionY.value;
    }, []);

    // Calculate ball velocity from position changes for dynamic effects
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

    // Calculate ball speed for dynamic shadow and effects
    const ballSpeed = useDerivedValue(() => {
      return Math.sqrt(velocityX.value * velocityX.value + velocityY.value * velocityY.value);
    });

    // Shadow offset derived from velocity
    const shadowOffsetX = useDerivedValue(() => {
      return velocityX.value * 0.8;
    });

    const shadowOffsetY = useDerivedValue(() => {
      return velocityY.value * 0.8;
    });

    // Dynamic ball scale - slight squish effect when moving fast
    const dynamicScale = useDerivedValue(() => {
      const baseScale = 1.0;
      // Calculate scale factors based on velocity components
      const xScale = 1 - Math.min(0.1, Math.abs(velocityX.value) * 0.01);
      const yScale = 1 - Math.min(0.1, Math.abs(velocityY.value) * 0.01);
      return { x: xScale * baseScale, y: yScale * baseScale };
    });

    const animatedProps = useAnimatedProps(() => {
      return {
        cx: ballPositionX.value,
        cy: ballPositionY.value,
      };
    });

    // Simple shadow that works across platforms
    const shadowProps = useAnimatedProps(() => {
      const offsetX = shadowOffsetX.value;
      const offsetY = shadowOffsetY.value;
      const opacity = Math.min(0.4, 0.2 + (ballSpeed.value * 0.05));

      return {
        cx: ballPositionX.value + offsetX,
        cy: ballPositionY.value + offsetY + 1.5, // Add slight y offset for shadow
        r: radius * 1.02,
        opacity: opacity,
      };
    });

    const glowProps = useAnimatedProps(() => {
      return {
        cx: ballPositionX.value,
        cy: ballPositionY.value,
        opacity: 0.3 + (pulseAnim.value * 0.1),
        r: radius * (1.1 + pulseAnim.value * 0.05)
      };
    });

    // Ball scaling animation for squish effect
    const scaleXProps = useAnimatedProps(() => {
      return {
        rx: radius * dynamicScale.value.x,
        ry: radius * dynamicScale.value.y,
        cx: ballPositionX.value,
        cy: ballPositionY.value,
      };
    });

    useEffect(() => {
      // Start progress animation for gradient movement
      progress.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );

      // Start pulse animation for subtle alive feel
      pulseAnim.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    }, []);

    // We'll use animatedProps for gradient animation instead of individual derived values

    // Use static values for the gradient props to avoid the warning
    const getLinearGradientProps = (skin: any) => {
      // Always return static values during render to avoid the warning
      if (!skin?.animated) {
        return { x1: "0%", y1: "0%", x2: "100%", y2: "100%" };
      } else {
        // For animated skins, we'll use fixed values during render
        // The animation will be handled by the AnimatedProps
        return { x1: "0%", y1: "0%", x2: "100%", y2: "100%" };
      }
    };

    // Create an animated gradient component that will update properly
    const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

    // Create animated props for the gradient
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
      const gradientId = `ball-grad-${skin.id}`;
      const patternId = `ball-pattern-${skin.id}`;
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

    return (
      <>
        <Defs>
          {skin?.type === 'gradient' && (
            skin.gradientDirection === 'radial' ? (
              <RadialGradient id={`ball-grad-${skin.id}`} cx="50%" cy="50%" r="50%">
                {skin.colors.map((c, index) => (
                  <Stop key={index} offset={`${(index / (skin.colors.length - 1)) * 100}%`} stopColor={c} />
                ))}
              </RadialGradient>
            ) : (
              skin.animated ? (
                <AnimatedLinearGradient
                  id={`ball-grad-${skin.id}`}
                  animatedProps={animatedGradientProps}
                >
                  {skin.colors.map((c, index) => (
                    <Stop key={index} offset={`${(index / (skin.colors.length - 1)) * 100}%`} stopColor={c} />
                  ))}
                </AnimatedLinearGradient>
              ) : (
                <LinearGradient
                  id={`ball-grad-${skin.id}`}
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
            <Pattern id={`ball-pattern-${skin.id}`} patternUnits="userSpaceOnUse" width="10" height="10">
              <Rect width="10" height="10" fill={skin.colors[0]} />
              <Circle cx="5" cy="5" r="2" fill={skin.colors[1]} />
            </Pattern>
          )}
          {skin?.type === 'pattern' && skin.patternType === 'stripes' && (
            <Pattern id={`ball-pattern-${skin.id}`} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
              <Rect width="10" height="10" fill={skin.colors[0]} />
              <Rect width="5" height="10" fill={skin.colors[1]} />
            </Pattern>
          )}
        </Defs>

        {/* Simple shadow under the ball - no filters used */}
        <AnimatedCircle
          animatedProps={shadowProps}
          fill="rgba(0,0,0,0.3)"
        />

        {/* Subtle glow around the ball */}
        <AnimatedCircle
          animatedProps={glowProps}
          fill="rgba(255,255,255,0.2)"
        />

        {/* Main ball with ellipse deformation based on movement */}
        <AnimatedCircle
          animatedProps={scaleXProps}
          fill={renderFill()}
        />

        {/* Highlight spot on the ball for 3D effect */}
        <AnimatedCircle
          animatedProps={useAnimatedProps(() => ({
            cx: ballPositionX.value - radius * 0.3,
            cy: ballPositionY.value - radius * 0.3,
            r: radius * 0.3
          }))}
          fill="rgba(255,255,255,0.2)"
        />
      </>
    );
  }
);

MazeBall.displayName = 'MazeBall';
