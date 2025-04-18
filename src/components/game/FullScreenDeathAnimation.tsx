import React, { useEffect, useRef } from 'react';
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

interface FullScreenDeathAnimationProps {
  visible: boolean;
  position: { x: number; y: number };
  onAnimationComplete: () => void;
  colors: ThemeColors;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ANIMATION_DURATION = 1800; // Slightly longer for more dramatic effect

const FullScreenDeathAnimation: React.FC<FullScreenDeathAnimationProps> = ({
  visible,
  position,
  onAnimationComplete,
  colors,
}) => {
  // Animation values
  const flashOpacity = useSharedValue(0);
  const shockwaveScale = useSharedValue(0.01);
  const shockwaveOpacity = useSharedValue(0);
  const secondShockwaveOpacity = useSharedValue(0);
  const secondShockwaveScale = useSharedValue(0.01);
  const fadeToBlackOpacity = useSharedValue(0);

  // Create particles for explosion effect
  const particleCount = 30; // More particles for a more dramatic effect

  // Create fragments (larger pieces) for additional visual interest
  const fragmentCount = 8;
  // Small particles
  const particles = Array.from({ length: particleCount }).map(() => ({
    scale: useSharedValue(0),
    opacity: useSharedValue(0),
    translateX: useSharedValue(0),
    translateY: useSharedValue(0),
    rotation: useSharedValue(0),
  }));

  // Larger fragments
  const fragments = Array.from({ length: fragmentCount }).map(() => ({
    scale: useSharedValue(0),
    opacity: useSharedValue(0),
    translateX: useSharedValue(0),
    translateY: useSharedValue(0),
    rotation: useSharedValue(0),
    width: Math.random() * 15 + 10, // Random width between 10-25
    height: Math.random() * 15 + 10, // Random height between 10-25
  }));

  // Run animation when visible changes
  useEffect(() => {
    if (visible) {
      // Reset animation values
      flashOpacity.value = 0;
      shockwaveScale.value = 0.01;
      shockwaveOpacity.value = 0;
      fadeToBlackOpacity.value = 0;

      // Reset particles
      particles.forEach(particle => {
        particle.scale.value = 0;
        particle.opacity.value = 0;
        particle.translateX.value = 0;
        particle.translateY.value = 0;
        particle.rotation.value = 0;
      });

      // Reset fragments
      fragments.forEach(fragment => {
        fragment.scale.value = 0;
        fragment.opacity.value = 0;
        fragment.translateX.value = 0;
        fragment.translateY.value = 0;
        fragment.rotation.value = 0;
      });

      // Start animation sequence

      // 1. Initial flash - brighter and longer
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 350, easing: Easing.in(Easing.cubic) })
      );

      // 2. Shockwave effect - multiple waves
      shockwaveOpacity.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) })
      );

      shockwaveScale.value = withTiming(2.0, {
        duration: 800,
        easing: Easing.out(Easing.cubic)
      });

      // Add a second shockwave with delay
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

      // 3. Particles explosion - more dynamic with varying speeds
      particles.forEach((particle, index) => {
        // Random angle for each particle
        const angle = (index / particleCount) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 200 + Math.random() * 200; // Increased distance
        const delay = Math.random() * 150;
        const duration = 600 + Math.random() * 600; // Longer duration

        // Random rotation - more rotation
        particle.rotation.value = withDelay(
          delay,
          withTiming(Math.random() * 12 - 6, { duration })
        );

        // Scale up and down - larger scale
        particle.scale.value = withDelay(
          delay,
          withSequence(
            withTiming(1.2 + Math.random() * 0.8, { duration: duration * 0.3 }),
            withTiming(0, { duration: duration * 0.7 })
          )
        );

        // Fade in and out
        particle.opacity.value = withDelay(
          delay,
          withSequence(
            withTiming(0.9 + Math.random() * 0.1, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.8 })
          )
        );

        // Move outward with easing for more natural movement
        particle.translateX.value = withDelay(
          delay,
          withTiming(Math.cos(angle) * distance, {
            duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
          })
        );

        particle.translateY.value = withDelay(
          delay,
          withTiming(Math.sin(angle) * distance, {
            duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
          })
        );
      });

      // 3b. Fragments animation - larger pieces with different physics
      fragments.forEach((fragment, index) => {
        // Random angle with less spread for fragments
        const angle = (index / fragmentCount) * Math.PI * 2 + Math.random() * 0.3;
        const distance = 100 + Math.random() * 100; // Shorter distance than particles
        const delay = Math.random() * 100;
        const duration = 800 + Math.random() * 400; // Longer duration for fragments

        // More rotation for fragments
        fragment.rotation.value = withDelay(
          delay,
          withTiming(Math.random() * 8 - 4 + (index % 2 ? Math.PI : 0), { duration })
        );

        // Scale up quickly and down slowly
        fragment.scale.value = withDelay(
          delay,
          withSequence(
            withTiming(1 + Math.random() * 0.3, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.8 })
          )
        );

        // Fade in quickly and out slowly
        fragment.opacity.value = withDelay(
          delay,
          withSequence(
            withTiming(0.95, { duration: duration * 0.1 }),
            withTiming(0, { duration: duration * 0.9 })
          )
        );

        // Move outward with physics-like easing
        fragment.translateX.value = withDelay(
          delay,
          withTiming(Math.cos(angle) * distance, {
            duration,
            easing: Easing.bezier(0.2, 0.8, 0.2, 1) // Custom physics-like curve
          })
        );

        fragment.translateY.value = withDelay(
          delay,
          withTiming(Math.sin(angle) * distance + 30, { // Add some gravity
            duration,
            easing: Easing.bezier(0.2, 0.8, 0.2, 1)
          })
        );
      });

      // 4. Fade to black - with slight pulse effect
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
  }, [visible, flashOpacity, shockwaveScale, shockwaveOpacity, secondShockwaveOpacity, secondShockwaveScale, fadeToBlackOpacity, particles, fragments, particleCount, fragmentCount, position.x, position.y, onAnimationComplete]);

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

  // Second shockwave style
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

      {/* Small Particles */}
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

      {/* Larger Fragments */}
      {fragments.map((fragment, index) => {
        const fragmentStyle = useAnimatedStyle(() => ({
          opacity: fragment.opacity.value,
          transform: [
            { translateX: fragment.translateX.value },
            { translateY: fragment.translateY.value },
            { scale: fragment.scale.value },
            { rotate: `${fragment.rotation.value}rad` },
          ],
        }));

        // Determine shape - some rectangular, some triangular
        const isTriangle = index % 3 === 0;
        const fragmentShapeStyle = isTriangle ? styles.triangleFragment : styles.rectangleFragment;

        return (
          <Animated.View
            key={`fragment-${index}`}
            style={[
              fragmentShapeStyle,
              {
                left: position.x,
                top: position.y,
                width: fragment.width,
                height: fragment.height,
                backgroundColor: index % 2 === 0 ? colors.error : colors.errorContainer,
                marginLeft: -fragment.width / 2,
                marginTop: -fragment.height / 2,
              },
              fragmentStyle,
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
  rectangleFragment: {
    position: 'absolute',
    borderRadius: 2,
  },
  triangleFragment: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  fadeToBlack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default React.memo(FullScreenDeathAnimation);
