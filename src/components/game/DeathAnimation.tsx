import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { ThemeColors } from '../../types';

interface DeathAnimationProps {
  visible: boolean;
  position: { x: number; y: number };
  onAnimationComplete: () => void;
  colors: ThemeColors;
}

const DeathAnimation: React.FC<DeathAnimationProps> = ({
  visible,
  position,
  onAnimationComplete,
  colors,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  // Create particles for explosion effect
  const particleCount = 12; // Increased from 8 for more particles
  const particles = Array.from({ length: particleCount }).map(() => ({
    opacity: useRef(new Animated.Value(0)).current,
    translateX: useRef(new Animated.Value(0)).current,
    translateY: useRef(new Animated.Value(0)).current,
    scale: useRef(new Animated.Value(0.5)).current,
  }));

  useEffect(() => {
    if (visible) {
      // Reset animation values
      opacity.setValue(1);
      scale.setValue(0.1);
      rotation.setValue(0);

      particles.forEach(particle => {
        particle.opacity.setValue(1);
        particle.translateX.setValue(0);
        particle.translateY.setValue(0);
        particle.scale.setValue(0.5);
      });

      // Main ball explosion animation
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 2.0, // Increased from 1.5 for more visible explosion
            duration: 150,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(rotation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),

        // Explode
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),

          // Particle animations
          ...particles.flatMap((particle, i) => {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = 70; // Increased from 50 for wider explosion

            return [
              Animated.timing(particle.translateX, {
                toValue: Math.cos(angle) * distance,
                duration: 500,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
              }),
              Animated.timing(particle.translateY, {
                toValue: Math.sin(angle) * distance,
                duration: 500,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
              }),
              Animated.sequence([
                Animated.timing(particle.scale, {
                  toValue: 1,
                  duration: 150,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.scale, {
                  toValue: 0,
                  duration: 350,
                  useNativeDriver: true,
                }),
              ]),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 500,
                delay: 150,
                useNativeDriver: true,
              }),
            ];
          }),
        ]),

        // Delay before completing
        Animated.delay(100),
      ]).start(() => {
        onAnimationComplete();
      });
    }
  }, [visible, opacity, scale, rotation, particles, onAnimationComplete]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Main ball */}
      <Animated.View
        style={[
          styles.ball,
          {
            left: position.x - 7, // Adjust based on ball radius
            top: position.y - 7,
            backgroundColor: colors.error,
            opacity,
            transform: [
              { scale },
              { rotate: spin },
            ],
          },
        ]}
      />

      {/* Particles */}
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              left: position.x - 3, // Center the particle (width is 6)
              top: position.y - 3,  // Center the particle (height is 6)
              backgroundColor: index % 2 === 0 ? colors.error : colors.errorContainer,
              opacity: particle.opacity,
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
                { scale: particle.scale },
              ],
            },
          ]}
        />
      ))}
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
    zIndex: 900,
  },
  ball: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    zIndex: 1000, // Ensure it's above other elements
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    zIndex: 1000, // Ensure it's above other elements
  },
});

export default React.memo(DeathAnimation);
