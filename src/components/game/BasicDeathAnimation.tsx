import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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

interface BasicDeathAnimationProps {
  visible: boolean;
  position: { x: number; y: number };
  onAnimationComplete: () => void;
  colors: ThemeColors;
}

const ANIMATION_DURATION = 1800;

const BasicDeathAnimation: React.FC<BasicDeathAnimationProps> = ({
  visible,
  position,
  onAnimationComplete,
  colors,
}) => {
  // Animation values - all defined at the top level
  const flashOpacity = useSharedValue(0);
  const shockwaveScale = useSharedValue(0.01);
  const shockwaveOpacity = useSharedValue(0);
  const secondShockwaveScale = useSharedValue(0.01);
  const secondShockwaveOpacity = useSharedValue(0);
  const fadeToBlackOpacity = useSharedValue(0);

  // Create a few fixed particles (no dynamic arrays)
  const particle1Scale = useSharedValue(0);
  const particle1Opacity = useSharedValue(0);
  const particle1TranslateX = useSharedValue(0);
  const particle1TranslateY = useSharedValue(0);
  const particle1Rotation = useSharedValue(0);

  const particle2Scale = useSharedValue(0);
  const particle2Opacity = useSharedValue(0);
  const particle2TranslateX = useSharedValue(0);
  const particle2TranslateY = useSharedValue(0);
  const particle2Rotation = useSharedValue(0);

  const particle3Scale = useSharedValue(0);
  const particle3Opacity = useSharedValue(0);
  const particle3TranslateX = useSharedValue(0);
  const particle3TranslateY = useSharedValue(0);
  const particle3Rotation = useSharedValue(0);

  const particle4Scale = useSharedValue(0);
  const particle4Opacity = useSharedValue(0);
  const particle4TranslateX = useSharedValue(0);
  const particle4TranslateY = useSharedValue(0);
  const particle4Rotation = useSharedValue(0);

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
      particle1Scale.value = 0;
      particle1Opacity.value = 0;
      particle1TranslateX.value = 0;
      particle1TranslateY.value = 0;
      particle1Rotation.value = 0;

      particle2Scale.value = 0;
      particle2Opacity.value = 0;
      particle2TranslateX.value = 0;
      particle2TranslateY.value = 0;
      particle2Rotation.value = 0;

      particle3Scale.value = 0;
      particle3Opacity.value = 0;
      particle3TranslateX.value = 0;
      particle3TranslateY.value = 0;
      particle3Rotation.value = 0;

      particle4Scale.value = 0;
      particle4Opacity.value = 0;
      particle4TranslateX.value = 0;
      particle4TranslateY.value = 0;
      particle4Rotation.value = 0;

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

      // Particle 1 - top right
      const angle1 = Math.PI * 0.25; // 45 degrees
      const distance1 = 150;
      const duration1 = 600;

      particle1Rotation.value = withTiming(Math.PI * 2, { duration: duration1 });
      particle1Scale.value = withSequence(
        withTiming(1.2, { duration: duration1 * 0.3 }),
        withTiming(0, { duration: duration1 * 0.7 })
      );
      particle1Opacity.value = withSequence(
        withTiming(0.9, { duration: duration1 * 0.2 }),
        withTiming(0, { duration: duration1 * 0.8 })
      );
      particle1TranslateX.value = withTiming(Math.cos(angle1) * distance1, { duration: duration1 });
      particle1TranslateY.value = withTiming(Math.sin(angle1) * distance1, { duration: duration1 });

      // Particle 2 - bottom right
      const angle2 = Math.PI * 0.75; // 135 degrees
      const distance2 = 170;
      const duration2 = 700;

      particle2Rotation.value = withTiming(-Math.PI, { duration: duration2 });
      particle2Scale.value = withSequence(
        withTiming(1.5, { duration: duration2 * 0.3 }),
        withTiming(0, { duration: duration2 * 0.7 })
      );
      particle2Opacity.value = withSequence(
        withTiming(0.8, { duration: duration2 * 0.2 }),
        withTiming(0, { duration: duration2 * 0.8 })
      );
      particle2TranslateX.value = withTiming(Math.cos(angle2) * distance2, { duration: duration2 });
      particle2TranslateY.value = withTiming(Math.sin(angle2) * distance2, { duration: duration2 });

      // Particle 3 - bottom left
      const angle3 = Math.PI * 1.25; // 225 degrees
      const distance3 = 130;
      const duration3 = 550;

      particle3Rotation.value = withTiming(Math.PI * 1.5, { duration: duration3 });
      particle3Scale.value = withSequence(
        withTiming(1.1, { duration: duration3 * 0.3 }),
        withTiming(0, { duration: duration3 * 0.7 })
      );
      particle3Opacity.value = withSequence(
        withTiming(0.95, { duration: duration3 * 0.2 }),
        withTiming(0, { duration: duration3 * 0.8 })
      );
      particle3TranslateX.value = withTiming(Math.cos(angle3) * distance3, { duration: duration3 });
      particle3TranslateY.value = withTiming(Math.sin(angle3) * distance3, { duration: duration3 });

      // Particle 4 - top left
      const angle4 = Math.PI * 1.75; // 315 degrees
      const distance4 = 160;
      const duration4 = 650;

      particle4Rotation.value = withTiming(-Math.PI * 0.5, { duration: duration4 });
      particle4Scale.value = withSequence(
        withTiming(1.3, { duration: duration4 * 0.3 }),
        withTiming(0, { duration: duration4 * 0.7 })
      );
      particle4Opacity.value = withSequence(
        withTiming(0.85, { duration: duration4 * 0.2 }),
        withTiming(0, { duration: duration4 * 0.8 })
      );
      particle4TranslateX.value = withTiming(Math.cos(angle4) * distance4, { duration: duration4 });
      particle4TranslateY.value = withTiming(Math.sin(angle4) * distance4, { duration: duration4 });

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
  }, [
    visible,
    onAnimationComplete,
    flashOpacity,
    shockwaveScale,
    shockwaveOpacity,
    secondShockwaveScale,
    secondShockwaveOpacity,
    fadeToBlackOpacity,
    particle1Scale,
    particle1Opacity,
    particle1TranslateX,
    particle1TranslateY,
    particle1Rotation,
    particle2Scale,
    particle2Opacity,
    particle2TranslateX,
    particle2TranslateY,
    particle2Rotation,
    particle3Scale,
    particle3Opacity,
    particle3TranslateX,
    particle3TranslateY,
    particle3Rotation,
    particle4Scale,
    particle4Opacity,
    particle4TranslateX,
    particle4TranslateY,
    particle4Rotation
  ]);

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

  // Particle styles
  const particle1Style = useAnimatedStyle(() => ({
    opacity: particle1Opacity.value,
    transform: [
      { translateX: particle1TranslateX.value },
      { translateY: particle1TranslateY.value },
      { scale: particle1Scale.value },
      { rotate: `${particle1Rotation.value}rad` },
    ],
  }));

  const particle2Style = useAnimatedStyle(() => ({
    opacity: particle2Opacity.value,
    transform: [
      { translateX: particle2TranslateX.value },
      { translateY: particle2TranslateY.value },
      { scale: particle2Scale.value },
      { rotate: `${particle2Rotation.value}rad` },
    ],
  }));

  const particle3Style = useAnimatedStyle(() => ({
    opacity: particle3Opacity.value,
    transform: [
      { translateX: particle3TranslateX.value },
      { translateY: particle3TranslateY.value },
      { scale: particle3Scale.value },
      { rotate: `${particle3Rotation.value}rad` },
    ],
  }));

  const particle4Style = useAnimatedStyle(() => ({
    opacity: particle4Opacity.value,
    transform: [
      { translateX: particle4TranslateX.value },
      { translateY: particle4TranslateY.value },
      { scale: particle4Scale.value },
      { rotate: `${particle4Rotation.value}rad` },
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
      <Animated.View
        style={[
          styles.particle,
          {
            left: position.x,
            top: position.y,
            backgroundColor: colors.error,
          },
          particle1Style,
        ]}
      />

      <Animated.View
        style={[
          styles.particle,
          {
            left: position.x,
            top: position.y,
            backgroundColor: colors.errorContainer,
          },
          particle2Style,
        ]}
      />

      <Animated.View
        style={[
          styles.particle,
          {
            left: position.x,
            top: position.y,
            backgroundColor: colors.onError,
          },
          particle3Style,
        ]}
      />

      <Animated.View
        style={[
          styles.particle,
          {
            left: position.x,
            top: position.y,
            backgroundColor: colors.error,
          },
          particle4Style,
        ]}
      />

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
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    marginTop: -5,
  },
  fadeToBlack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default React.memo(BasicDeathAnimation);
