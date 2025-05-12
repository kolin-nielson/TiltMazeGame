import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text } from 'react-native-paper';
import { ThemeColors } from '@types';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppSelector } from '@store';
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
  const bonusCoins = Math.floor(level * 1.5);
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
        <View style={styles.contentContainer}>
          <Text style={[styles.levelCompleted, { color: colors?.onSurface }]}>
            Level {level} Completed!
          </Text>
          <Text style={[styles.nextLevel, { color: colors?.onSurfaceVariant }]}>
            Get ready for level {level + 1}
          </Text>
          {}
          <View style={styles.bonusContainer}>
            <Text style={[styles.bonusText, { color: colors?.onSurfaceVariant }]}>
              Bonus
            </Text>
            <View style={styles.coinRow}>
              <MaterialIcons name="monetization-on" size={24} color="#FFD700" />
              <Text style={[styles.bonusCoins, { color: colors?.secondary }]}>
                +{bonusCoins}
              </Text>
            </View>
          </View>
        </View>
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
    padding: 24,
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
  levelCompleted: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  nextLevel: {
    fontSize: 16,
  },
  bonusContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  bonusText: {
    fontSize: 16,
    marginBottom: 8,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bonusCoins: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
export default React.memo(LevelTransition);
