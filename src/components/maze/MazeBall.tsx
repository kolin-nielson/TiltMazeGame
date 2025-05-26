import React, { memo, useEffect } from 'react';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop, Pattern, Rect, Path, G } from 'react-native-svg';
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
    const colors = useAppSelector(state => state.theme.colors);
    const skin = skins.find(s => s.id === equippedSkin);
    const trail = trails.find(t => t.id === equippedTrail);
    const defaultColor = colors.ball || colors.error; 
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
    }, []);
    const velocityY = useDerivedValue(() => {
      const dy = ballPositionY.value - lastPositionY.value;
      lastPositionY.value = ballPositionY.value;
      return dy;
    }, []);
    const ballProps = useDerivedValue(() => {
      const speed = Math.sqrt(velocityX.value * velocityX.value + velocityY.value * velocityY.value);
      const baseScale = 1.0;
      const directionFactor = speed > 0.1 ? 0.15 : 0;
      const xContribution = Math.abs(velocityX.value) / (speed + 0.01); 
      const yContribution = Math.abs(velocityY.value) / (speed + 0.01);
      
      return {
        speed,
        xScale: 1 - (Math.min(0.15, Math.abs(velocityX.value) * 0.015) * xContribution * directionFactor),
        yScale: 1 - (Math.min(0.15, Math.abs(velocityY.value) * 0.015) * yContribution * directionFactor),
        shadowOffsetX: velocityX.value * 0.8,
        shadowOffsetY: velocityY.value * 0.8,
      };
    });
    const animatedProps = useAnimatedProps(() => {
      return {
        cx: ballPositionX.value,
        cy: ballPositionY.value,
      };
    });
    const shadowProps = useAnimatedProps(() => {
      const speed = ballProps.value.speed;
      const baseOpacity = 0.25;
      const speedContribution = Math.min(0.2, speed * 0.05);
      const opacity = baseOpacity + speedContribution;
      const sizeMultiplier = 1.02 + Math.min(0.08, speed * 0.01);
      
      return {
        cx: ballPositionX.value + ballProps.value.shadowOffsetX,
        cy: ballPositionY.value + ballProps.value.shadowOffsetY + 1.5,
        r: radius * sizeMultiplier,
        opacity: opacity,
      };
    });
    const glowProps = useAnimatedProps(() => {
      const speed = ballProps.value.speed;
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
      const speed = ballProps.value.speed;
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
      
      switch (skin.type) {
        case 'gradient':
        case 'special':
        case 'legendary':
          return `url(#${gradientId})`;
        case 'pattern':
          return `url(#${patternId})`;
        case 'solid':
        default: 
          return skin.colors[0];
      }
    };
    const gradientId = React.useMemo(() => `ball-grad-${skin?.id || 'default'}`, [skin?.id]);
    const patternId = React.useMemo(() => `ball-pattern-${skin?.id || 'default'}`, [skin?.id]);
    const trailPositions = useSharedValue<{x: number, y: number, time: number}[]>([]);
    useDerivedValue(() => {
      const now = Date.now();
      const speed = ballProps.value.speed;
      if (speed > 0.02) { // More sensitive to movement
        trailPositions.value = [
          {
            x: ballPositionX.value,
            y: ballPositionY.value,
            time: now
          },
          ...trailPositions.value
        ].slice(0, 15); // More trail particles
      }
      trailPositions.value = trailPositions.value.filter(
        point => now - point.time < 800 // Longer lasting trail
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
        const speed = ballProps.value.speed;
        const baseTrailOpacity = 0.4; // Much more visible
        const speedContribution = Math.min(0.5, speed * 0.08); 
        const maxOpacity = baseTrailOpacity + speedContribution; 
        const opacity = maxOpacity * (1 - (age / 800)); // Match new duration
        const size = radius * (0.9 - (index * 0.06)); // More gradual size decrease
        return {
          cx: point.x,
          cy: point.y,
          r: Math.max(size, radius * 0.3), // Minimum size for visibility
          opacity: Math.max(opacity, 0.1) // Minimum opacity
        };
      });
    };
    const trailProps1 = generateTrailProps(0);
    const trailProps2 = generateTrailProps(1);
    const trailProps3 = generateTrailProps(2);
    const trailProps4 = generateTrailProps(3);
    const trailProps5 = generateTrailProps(4);
    const trailProps6 = generateTrailProps(5);
    const trailProps7 = generateTrailProps(6);
    const trailProps8 = generateTrailProps(7);
    return (
      <>
        <Defs>
          {skin && ['gradient', 'special', 'legendary'].includes(skin.type) && (
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
          {skin?.type === 'pattern' && skin.patternType === 'scales' && (
            <Pattern id={patternId} patternUnits="userSpaceOnUse" width="12" height="12">
              <Rect width="12" height="12" fill={skin.colors[0]} />
              <Circle cx="6" cy="3" r="3" fill={skin.colors[1]} opacity="0.8" />
              <Circle cx="0" cy="9" r="3" fill={skin.colors[1]} opacity="0.8" />
              <Circle cx="12" cy="9" r="3" fill={skin.colors[1]} opacity="0.8" />
            </Pattern>
          )}
          {skin?.type === 'pattern' && skin.patternType === 'chevron' && (
            <Pattern id={patternId} patternUnits="userSpaceOnUse" width="16" height="16" patternTransform="rotate(45)">
              <Rect width="16" height="16" fill={skin.colors[0]} />
              <Rect x="0" y="0" width="8" height="8" fill={skin.colors[1]} />
              <Rect x="8" y="8" width="8" height="8" fill={skin.colors[1]} />
            </Pattern>
          )}
          {skin?.type === 'pattern' && skin.patternType === 'hexagon' && (
            <Pattern id={patternId} patternUnits="userSpaceOnUse" width="14" height="12">
              <Rect width="14" height="12" fill={skin.colors[0]} />
              <Circle cx="7" cy="6" r="4" fill={skin.colors[1]} opacity="0.7" />
            </Pattern>
          )}
          {skin?.type === 'pattern' && skin.patternType === 'marble' && (
            <Pattern id={patternId} patternUnits="userSpaceOnUse" width="20" height="20">
              <Rect width="20" height="20" fill={skin.colors[0]} />
              <Circle cx="5" cy="5" r="2" fill={skin.colors[1]} opacity="0.6" />
              <Circle cx="15" cy="8" r="3" fill={skin.colors[1]} opacity="0.4" />
              <Circle cx="8" cy="15" r="2.5" fill={skin.colors[1]} opacity="0.5" />
            </Pattern>
          )}
          {skin?.type === 'pattern' && skin.patternType === 'hearts' && (
            <Pattern id={patternId} patternUnits="userSpaceOnUse" width="16" height="16">
              <Rect width="16" height="16" fill={skin.colors[0]} />
              {/* Heart shape using path - optimized for ball rendering with pulsing effect */}
              <G transform="translate(8,5)">
                <Path 
                  d="M0,3 C-3,0 -6,2 -3,6 L0,9 L3,6 C6,2 3,0 0,3 Z" 
                  fill={skin.colors[1]} 
                  opacity="0.9"
                  transform="scale(0.7)"
                />
              </G>
              <G transform="translate(3,12)">
                <Path 
                  d="M0,3 C-3,0 -6,2 -3,6 L0,9 L3,6 C6,2 3,0 0,3 Z" 
                  fill={skin.colors[2]} 
                  opacity="0.7"
                  transform="scale(0.45)"
                />
              </G>
              <G transform="translate(13,9)">
                <Path 
                  d="M0,3 C-3,0 -6,2 -3,6 L0,9 L3,6 C6,2 3,0 0,3 Z" 
                  fill={skin.colors[1]} 
                  opacity="0.8"
                  transform="scale(0.55)"
                />
              </G>
              {/* Extra small floating hearts for magical effect */}
              <G transform="translate(1,3)">
                <Path 
                  d="M0,3 C-3,0 -6,2 -3,6 L0,9 L3,6 C6,2 3,0 0,3 Z" 
                  fill={skin.colors[1]} 
                  opacity="0.6"
                  transform="scale(0.3)"
                />
              </G>
              <G transform="translate(15,14)">
                <Path 
                  d="M0,3 C-3,0 -6,2 -3,6 L0,9 L3,6 C6,2 3,0 0,3 Z" 
                  fill={skin.colors[2]} 
                  opacity="0.5"
                  transform="scale(0.25)"
                />
              </G>
            </Pattern>
          )}
        </Defs>
        {/* Enhanced Trail System */}
        <AnimatedCircle
          animatedProps={trailProps8}
          fill={trail && trail.colors.length > 0 ? trail.colors[trail.colors.length - 1] : (skin?.type === 'solid' ? skin.colors[0] : 'transparent')}
        />
        <AnimatedCircle
          animatedProps={trailProps7}
          fill={trail && trail.colors.length > 1 ? trail.colors[trail.colors.length - 1] : (trail && trail.colors.length > 0 ? trail.colors[0] : (skin?.type === 'solid' ? skin.colors[0] : 'transparent'))}
        />
        <AnimatedCircle
          animatedProps={trailProps6}
          fill={trail && trail.colors.length > 2 ? trail.colors[2] : (trail && trail.colors.length > 0 ? trail.colors[0] : (skin?.type === 'solid' ? skin.colors[0] : 'transparent'))}
        />
        <AnimatedCircle
          animatedProps={trailProps5}
          fill={trail && trail.colors.length > 1 ? trail.colors[1] : (trail && trail.colors.length > 0 ? trail.colors[0] : (skin?.type === 'solid' ? skin.colors[0] : 'transparent'))}
        />
        <AnimatedCircle
          animatedProps={trailProps4}
          fill={trail && trail.colors.length > 0 ? trail.colors[0] : (skin?.type === 'solid' ? skin.colors[0] : 'transparent')}
        />
        <AnimatedCircle
          animatedProps={trailProps3}
          fill={trail && trail.colors.length > 1 ? trail.colors[1] : (trail && trail.colors.length > 0 ? trail.colors[0] : (skin?.type === 'solid' ? skin.colors[0] : 'transparent'))}
        />
        <AnimatedCircle
          animatedProps={trailProps2}
          fill={trail && trail.colors.length > 2 ? trail.colors[2] : (trail && trail.colors.length > 0 ? trail.colors[0] : (skin?.type === 'solid' ? skin.colors[0] : 'transparent'))}
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
            const speed = ballProps.value.speed;
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
