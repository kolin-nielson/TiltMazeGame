import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '@types';

interface TiltCalibrationOverlayProps {
  onCalibrationComplete: () => void;
  colors: ThemeColors;
  duration?: number;
  vibrationEnabled?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TiltCalibrationOverlay: React.FC<TiltCalibrationOverlayProps> = ({
  onCalibrationComplete,
  colors,
  duration = 2000,
  vibrationEnabled = true,
}) => {
  const [progress, setProgress] = useState(0);
  const [animatedValue] = useState(new Animated.Value(0));
  const [calibrationPhase, setCalibrationPhase] = useState('hold');
  const lastHapticRef = useRef(0);

  useEffect(() => {
    let animationRef: Animated.CompositeAnimation | null = null;

    setTimeout(() => {
      setCalibrationPhase('calibrating');

      if (vibrationEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      animationRef = Animated.timing(animatedValue, {
        toValue: 100,
        duration,
        useNativeDriver: false,
      });

      animationRef.start(({ finished }) => {
        if (finished) {
          setCalibrationPhase('complete');

          if (vibrationEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }

          setTimeout(() => {
            onCalibrationComplete();
          }, 300);
        }
      });
    }, 500);

    const interval = setInterval(() => {
      animatedValue.addListener(({ value }) => {
        setProgress(value);

        if (vibrationEnabled && value > 0) {
          const progressStep = Math.floor(value / 25);
          const now = Date.now();

          if (
            progressStep > Math.floor(lastHapticRef.current / 25) &&
            now - lastHapticRef.current > 300
          ) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            lastHapticRef.current = value;
          }
        }
      });
    }, 50);

    return () => {
      if (animationRef) {
        animationRef.stop();
      }
      clearInterval(interval);
      animatedValue.removeAllListeners();
    };
  }, [animatedValue, duration, onCalibrationComplete, vibrationEnabled]);

  const progressWidth = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const getPhaseContent = () => {
    switch (calibrationPhase) {
      case 'hold':
        return {
          icon: 'cellphone',
          title: 'Hold Device Still',
          subtitle: 'Preparing to calibrate...',
        };
      case 'calibrating':
        return {
          icon: 'cellphone-settings',
          title: 'Keep Holding Still',
          subtitle: 'Calibrating tilt controls...',
        };
      case 'complete':
        return {
          icon: 'check-circle-outline',
          title: 'Calibration Complete',
          subtitle: 'Tilt controls are ready!',
        };
      default:
        return {
          icon: 'cellphone',
          title: 'Hold Device Still',
          subtitle: 'Calibrating tilt controls...',
        };
    }
  };

  const { icon, title, subtitle } = getPhaseContent();

  const containerScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.spring(containerScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.overlay}>
      <Animated.View style={{ transform: [{ scale: containerScale }] }}>
        <Surface style={[styles.container, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons
            name={icon}
            size={48}
            color={colors.primary}
            style={styles.icon}
          />
          <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>
          <View style={[styles.progressContainer, { backgroundColor: colors.surfaceVariant }]}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.percentage, { color: colors.onSurfaceVariant }]}>
            {Math.round(progress)}%
          </Text>
        </Surface>
      </Animated.View>
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
    width: Math.min(SCREEN_WIDTH * 0.85, 350),
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

export default React.memo(TiltCalibrationOverlay);
