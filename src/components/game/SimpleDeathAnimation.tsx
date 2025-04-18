import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { ThemeColors } from '../../types';

interface SimpleDeathAnimationProps {
  visible: boolean;
  position: { x: number; y: number };
  onAnimationComplete: () => void;
  colors: ThemeColors;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ANIMATION_DURATION = 1800;

const SimpleDeathAnimation: React.FC<SimpleDeathAnimationProps> = ({
  visible,
  position,
  onAnimationComplete,
  colors,
}) => {
  // Animation values
  const flashOpacity = useSharedValue(0);
  const shockwaveScale = useSharedValue(0.01);
  const shockwaveOpacity = useSharedValue(0);
  const secondShockwaveScale = useSharedValue(0.01);
  const secondShockwaveOpacity = useSharedValue(0);
  const fadeToBlackOpacity = useSharedValue(0);

  // Create particles for explosion effect - limited number for better performance
  const particleCount = 12;
  const particles = React.useMemo(() => {
    return Array.from({ length: particleCount }).map(() => ({
      scale: useSharedValue(0),
      opacity: useSharedValue(0),
      translateX: useSharedValue(0),
      translateY: useSharedValue(0),
      rotation: useSharedValue(0),
    }));
  }, []);

  // Run animation when visible changes
  useEffect(() => {
    if (visible) {
      // Reset animation values
      flashOpacity.value = 0;
      shockwaveScale.value = 0.01;
      shockwaveOpacity.value = 0;
      secondShockwaveScale.value = 0.01;
      secondShockwaveOpacity.value = 0;
      fadeToBlackOpacity.value = 0;

      // Reset particles
      particles.forEach(particle => {
        particle.scale.value = 0;
        particle.opacity.value = 0;
        particle.translateX.value = 0;
        particle.translateY.value = 0;
        particle.rotation.value = 0;
      });

      // Start animation sequence

      // 1. Initial flash
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 350, easing: Easing.in(Easing.cubic) })
      );

      // 2. Shockwave effect
      shockwaveOpacity.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) })
      );

      shockwaveScale.value = withTiming(2.0, {
        duration: 800,
        easing: Easing.out(Easing.cubic)
      });

      // Second shockwave with delay
      secondShockwaveOpacity.value = withDelay(
        150,
        withSequence(
          withTiming(0.7, { duration: 100 }),
          withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
        )
      );

      secondShockwaveScale.value = withDelay(
        150,
        withTiming(1.7, {
          duration: 700,
          easing: Easing.out(Easing.cubic)
        })
      );

      // 3. Particles animation
      particles.forEach((particle, index) => {
        // Random angle for each particle
        const angle = (index / particleCount) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 150 + Math.random() * 150;
        const delay = Math.random() * 100;
        const duration = 500 + Math.random() * 500;

        // Random rotation
        particle.rotation.value = withDelay(
          delay,
          withTiming(Math.random() * 10 - 5, { duration })
        );

        // Scale up and down
        particle.scale.value = withDelay(
          delay,
          withSequence(
            withTiming(1 + Math.random() * 0.5, { duration: duration * 0.3 }),
            withTiming(0, { duration: duration * 0.7 })
          )
        );

        // Fade in and out
        particle.opacity.value = withDelay(
          delay,
          withSequence(
            withTiming(0.8 + Math.random() * 0.2, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.8 })
          )
        );

        // Move outward
        particle.translateX.value = withDelay(
          delay,
          withTiming(Math.cos(angle) * distance, { duration })
        );

        particle.translateY.value = withDelay(
          delay,
          withTiming(Math.sin(angle) * distance, { duration })
        );
      });

      // 3. Fade to black
      fadeToBlackOpacity.value = withDelay(
        350,
        withSequence(
          withTiming(0.7, {
            duration: 300,
            easing: Easing.out(Easing.cubic)
          }),
          withTiming(0.5, {
            duration: 150,
            easing: Easing.in(Easing.cubic)
          }),
          withTiming(1, {
            duration: ANIMATION_DURATION - 800,
            easing: Easing.inOut(Easing.cubic)
          }, () => {
            runOnJS(onAnimationComplete)();
          })
        )
      );
    }
  }, [visible, flashOpacity, shockwaveScale, shockwaveOpacity, secondShockwaveScale, secondShockwaveOpacity, fadeToBlackOpacity, particles, particleCount, position.x, position.y, onAnimationComplete]);

  // Animated styles
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const shockwaveStyle = useAnimatedStyle(() => ({
    opacity: shockwaveOpacity.value,
    transform: [
      { scale: shockwaveScale.value },
    ],
  }));

  const secondShockwaveStyle = useAnimatedStyle(() => ({
    opacity: secondShockwaveOpacity.value,
    transform: [
      { scale: secondShockwaveScale.value },
    ],
  }));

  const fadeToBlackStyle = useAnimatedStyle(() => ({
    opacity: fadeToBlackOpacity.value,
  }));

  // Don't render anything if not visible
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Initial flash */}
      <Animated.View
        style={[
          styles.flash,
          { backgroundColor: colors.error },
          flashStyle
        ]}
      />

      {/* Primary Shockwave */}
      <Animated.View
        style={[
          styles.shockwave,
          {
            left: position.x,
            top: position.y,
            borderColor: colors.error,
          },
          shockwaveStyle
        ]}
      />

      {/* Secondary Shockwave */}
      <Animated.View
        style={[
          styles.shockwave,
          {
            left: position.x,
            top: position.y,
            borderColor: colors.errorContainer,
            borderWidth: 3,
          },
          secondShockwaveStyle
        ]}
      />

      {/* Particles */}
      {particles.map((particle, index) => {
        const particleStyle = useAnimatedStyle(() => ({
          opacity: particle.opacity.value,
          transform: [
            { translateX: particle.translateX.value },
            { translateY: particle.translateY.value },
            { scale: particle.scale.value },
            { rotate: `${particle.rotation.value}rad` },
          ],
        }));

        return (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: position.x,
                top: position.y,
                backgroundColor: index % 3 === 0
                  ? colors.error
                  : index % 3 === 1
                    ? colors.errorContainer
                    : colors.onError,
              },
              particleStyle,
            ]}
          />
        );
      })}

      {/* Fade to black */}
      <Animated.View
        style={[
          styles.fadeToBlack,
          { backgroundColor: 'black' },
          fadeToBlackStyle
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  flash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shockwave: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 5,
    marginLeft: -25,
    marginTop: -25,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
  },
  fadeToBlack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default React.memo(SimpleDeathAnimation);
