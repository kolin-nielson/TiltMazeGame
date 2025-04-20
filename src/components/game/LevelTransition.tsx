import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text } from 'react-native-paper';
import { ThemeColors } from '@types';

interface LevelTransitionProps {
  level: number;
  visible: boolean;
  onTransitionComplete: () => void;
  colors: ThemeColors;
}

const LevelTransition: React.FC<LevelTransitionProps> = ({
  level,
  visible,
  onTransitionComplete,
  colors,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.5);
      textOpacity.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.9,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(1.5)),
          }),
        ]),

        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),

        Animated.delay(800),

        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onTransitionComplete();
      });
    }
  }, [visible, opacity, scale, textOpacity, onTransitionComplete]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          backgroundColor: colors.background,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.contentContainer,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <Text style={[styles.levelText, { color: colors.primary }]}>LEVEL</Text>
        <Animated.Text
          style={[
            styles.levelNumber,
            {
              color: colors.primary,
              opacity: textOpacity,
            },
          ]}
        >
          {level}
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  levelNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default React.memo(LevelTransition);
