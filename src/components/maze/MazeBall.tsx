import React, { memo } from 'react';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop, Pattern, Rect } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
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
    const defaultColor = '#B0BEC5';
    
    const animatedProps = useAnimatedProps(() => {
      return {
        cx: ballPositionX.value,
        cy: ballPositionY.value,
      };
    });

    const renderFill = () => {
      if (!skin) return defaultColor;
      const gradientId = `ball-grad-${skin.id}`;
      const patternId = `ball-pattern-${skin.id}`;
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
              <LinearGradient id={`ball-grad-${skin.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                {skin.colors.map((c, index) => (
                  <Stop key={index} offset={`${(index / (skin.colors.length - 1)) * 100}%`} stopColor={c} />
                ))}
              </LinearGradient>
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
        <AnimatedCircle 
          animatedProps={useAnimatedProps(() => ({
            cx: ballPositionX.value,
            cy: ballPositionY.value + 1,
          }))}
          r={radius}
          fill="rgba(0,0,0,0.3)"
        />
        <AnimatedCircle 
          animatedProps={animatedProps}
          r={radius}
          fill={renderFill()}
        />
      </>
    );
  }
);

MazeBall.displayName = 'MazeBall';
