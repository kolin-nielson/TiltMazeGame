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

    // Enhanced dynamic ball scale - more pronounced squish effect for visual feedback
    const dynamicScale = useDerivedValue(() => {
      const baseScale = 1.0;

      // Calculate speed for dynamic effects
      const speed = Math.sqrt(velocityX.value * velocityX.value + velocityY.value * velocityY.value);

      // Calculate direction-aware scale factors for more realistic deformation
      // This creates a more pronounced squish effect in the direction of movement
      const directionFactor = speed > 0.1 ? 0.15 : 0;
      const xContribution = Math.abs(velocityX.value) / (speed + 0.01); // Avoid division by zero
      const yContribution = Math.abs(velocityY.value) / (speed + 0.01);

      // Calculate scale factors with enhanced squish effect
      // The ball will compress more in the direction of movement and stretch perpendicular to it
      const xScale = 1 - (Math.min(0.15, Math.abs(velocityX.value) * 0.015) * xContribution * directionFactor);
      const yScale = 1 - (Math.min(0.15, Math.abs(velocityY.value) * 0.015) * yContribution * directionFactor);

      return {
        x: xScale * baseScale,
        y: yScale * baseScale,
        speed: speed // Pass speed for other effects
      };
    });

    const animatedProps = useAnimatedProps(() => {
      return {
        cx: ballPositionX.value,
        cy: ballPositionY.value,
      };
    });

    // Enhanced shadow effect for more realistic and satisfying visual feedback
    const shadowProps = useAnimatedProps(() => {
      // Calculate dynamic shadow offset based on velocity
      // This creates a more realistic shadow that follows the ball's movement
      const speed = dynamicScale.value.speed || 0;
      const offsetX = shadowOffsetX.value;
      const offsetY = shadowOffsetY.value;

      // Dynamic shadow opacity based on speed
      // Faster movement creates a more pronounced shadow
      const baseOpacity = 0.25;
      const speedContribution = Math.min(0.2, speed * 0.05);
      const opacity = baseOpacity + speedContribution;

      // Dynamic shadow size based on speed
      // Faster movement creates a slightly larger, more diffuse shadow
      const sizeMultiplier = 1.02 + Math.min(0.08, speed * 0.01);

      return {
        cx: ballPositionX.value + offsetX,
        cy: ballPositionY.value + offsetY + 1.5, // Add slight y offset for shadow
        r: radius * sizeMultiplier,
        opacity: opacity,
      };
    });

    // Enhanced glow effect for more dynamic visual feedback
    const glowProps = useAnimatedProps(() => {
      // Calculate speed-based glow intensity
      // Faster movement creates a more intense glow
      const speed = dynamicScale.value.speed || 0;
      const speedGlow = Math.min(0.15, speed * 0.03);

      // Combine speed glow with pulse animation for a dynamic effect
      const pulseEffect = pulseAnim.value * 0.1;
      const opacity = 0.25 + pulseEffect + speedGlow;

      // Dynamic glow size based on speed and pulse
      // Creates a more responsive and alive feel
      const sizeMultiplier = 1.1 + pulseAnim.value * 0.05 + Math.min(0.1, speed * 0.01);

      return {
        cx: ballPositionX.value,
        cy: ballPositionY.value,
        opacity: opacity,
        r: radius * sizeMultiplier
      };
    });

    // Enhanced ball scaling animation for more pronounced squish effect
    // This creates a more visually satisfying deformation as the ball moves
    const scaleXProps = useAnimatedProps(() => {
      // Calculate rotation angle based on velocity direction
      const angle = Math.atan2(velocityY.value, velocityX.value);
      const speed = dynamicScale.value.speed || 0;

      // Apply subtle rotation to the ball based on movement direction
      // This creates a more dynamic and responsive feel
      const rotationEffect = speed > 0.5 ? Math.sin(angle) * 0.1 : 0;

      // Apply subtle size variation based on speed
      // Faster movement makes the ball appear slightly smaller (like it's compressing)
      const sizeVariation = 1 - Math.min(0.05, speed * 0.005);

      return {
        r: radius * sizeVariation, // Apply subtle size variation
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

    // Generate unique IDs for SVG elements to avoid conflicts
    const uniqueId = `${Date.now()}`;
    const gradientId = `ball-grad-${skin?.id || 'default'}-${uniqueId}`;
    const patternId = `ball-pattern-${skin?.id || 'default'}-${uniqueId}`;

    // Track previous positions for motion trail effect
    const trailPositions = useSharedValue<{x: number, y: number, time: number}[]>([]);

    // Update trail positions
    useDerivedValue(() => {
      const now = Date.now();
      const speed = dynamicScale.value.speed || 0;

      // Only add trail points when moving at a certain speed
      if (speed > 0.05) { // Lowered threshold for trail point generation
        // Add current position to trail
        trailPositions.value = [
          {
            x: ballPositionX.value,
            y: ballPositionY.value,
            time: now
          },
          ...trailPositions.value
        ].slice(0, 10); // Keep only the 10 most recent positions
      }

      // Remove old trail points (older than 500ms)
      trailPositions.value = trailPositions.value.filter(
        point => now - point.time < 500
      );
    });

    // Generate trail circle props for each trail position
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

        // Calculate opacity based on age and speed
        // Faster movement creates more visible trails
        const baseTrailOpacity = 0.15; // Minimum opacity for trail
        const speedContribution = Math.min(0.35, speed * 0.05); // Opacity added by speed
        const maxOpacity = baseTrailOpacity + speedContribution; // Total max opacity up to 0.5
        const opacity = maxOpacity * (1 - (age / 500)); // Adjusted for 500ms lifetime

        // Calculate size based on age (older points are smaller)
        const size = radius * (0.8 - (index * 0.10)); // Less aggressive size reduction

        return {
          cx: point.x,
          cy: point.y,
          r: size,
          opacity: opacity
        };
      });
    };

    // Generate trail props for multiple trail points
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

        {/* Motion trail effect for more dynamic movement */}
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

        {/* Enhanced shadow under the ball */}
        <AnimatedCircle
          animatedProps={shadowProps}
          fill="rgba(0,0,0,0.3)"
        />

        {/* Enhanced glow around the ball */}
        <AnimatedCircle
          animatedProps={glowProps}
          fill="rgba(255,255,255,0.2)"
        />

        {/* Main ball with enhanced deformation based on movement */}
        <AnimatedCircle
          animatedProps={scaleXProps}
          fill={renderFill()}
        />

        {/* Enhanced highlight spot on the ball for 3D effect */}
        <AnimatedCircle
          animatedProps={useAnimatedProps(() => {
            const speed = dynamicScale.value.speed || 0;
            // Dynamic highlight that shifts based on movement direction
            const offsetX = -radius * 0.3 + (velocityX.value * 0.02);
            const offsetY = -radius * 0.3 + (velocityY.value * 0.02);
            // Highlight gets smaller at higher speeds for more dynamic feel
            const highlightSize = radius * (0.3 - Math.min(0.1, speed * 0.01));

            return {
              cx: ballPositionX.value + offsetX,
              cy: ballPositionY.value + offsetY,
              r: highlightSize,
              opacity: 0.25 - Math.min(0.1, speed * 0.02) // Highlight fades slightly with speed
            };
          })}
          fill="rgba(255,255,255,0.25)"
        />
      </>
    );
  }
);

MazeBall.displayName = 'MazeBall';
