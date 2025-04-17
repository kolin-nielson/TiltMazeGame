import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types';

interface TiltCalibrationOverlayProps {
  onCalibrationComplete: () => void;
  colors: ThemeColors;
  duration?: number;
}

const TiltCalibrationOverlay: React.FC<TiltCalibrationOverlayProps> = ({
  onCalibrationComplete,
  colors,
  duration = 2000,
}) => {
  const [progress, setProgress] = useState(0);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.timing(animatedValue, {
      toValue: 100,
      duration,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        onCalibrationComplete();
      }
    });

    const interval = setInterval(() => {
      animatedValue.addListener(({ value }) => {
        setProgress(value);
      });
    }, 50);

    return () => {
      animation.stop();
      clearInterval(interval);
      animatedValue.removeAllListeners();
    };
  }, [animatedValue, duration, onCalibrationComplete]);

  const progressWidth = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.overlay}>
      <Surface style={[styles.container, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons
          name="compass-outline"
          size={48}
          color={colors.primary}
          style={styles.icon}
        />
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Hold Device Still
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Calibrating tilt controls...
        </Text>
        <View style={[styles.progressContainer, { backgroundColor: colors.surfaceVariant }]}>
          <Animated.View
            style={[styles.progressBar, {
              width: progressWidth,
              backgroundColor: colors.primary
            }]}
          />
        </View>
        <Text style={[styles.percentage, { color: colors.onSurfaceVariant }]}>
          {Math.round(progress)}%
        </Text>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  container: {
    width: '80%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
  },
  percentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TiltCalibrationOverlay;
