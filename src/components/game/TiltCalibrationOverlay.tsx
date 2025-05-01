import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '@types';

interface TiltCalibrationOverlayProps {
  onCalibrationComplete: () => void;
  colors: ThemeColors;
  duration?: number;
  vibrationEnabled?: boolean;
  onManualRecalibrate?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TiltCalibrationOverlay: React.FC<TiltCalibrationOverlayProps> = ({
  onCalibrationComplete,
  colors,
  duration = 3000, // Increased for more reliable calibration
  vibrationEnabled = true,
  onManualRecalibrate,
}) => {
  const [progress, setProgress] = useState(0);
  const [animatedValue] = useState(new Animated.Value(0));
  const [calibrationPhase, setCalibrationPhase] = useState('prepare');
  const [showTips, setShowTips] = useState(false);
  const lastHapticRef = useRef(0);
  
  // Phone tilt animation
  const phoneTiltAnim = useRef(new Animated.Value(0)).current;
  
  // Animated values for the bubble level
  const bubblePosition = useRef(new Animated.Value(0)).current;
  const bubbleSize = useRef(new Animated.Value(1)).current;
  
  // Start an animated loop for the phone tilt in the instructions
  useEffect(() => {
    if (calibrationPhase === 'prepare') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(phoneTiltAnim, {
            toValue: -10,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(phoneTiltAnim, {
            toValue: 10,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(phoneTiltAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop the animation when calibration starts
      phoneTiltAnim.setValue(0);
    }
  }, [calibrationPhase, phoneTiltAnim]);
  
  // Start bubble level animation during calibration
  useEffect(() => {
    if (calibrationPhase === 'calibrating') {
      // Animate the bubble to simulate finding level
      Animated.sequence([
        Animated.timing(bubblePosition, {
          toValue: -15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(bubblePosition, {
          toValue: 10,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bubblePosition, {
          toValue: -5,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bubblePosition, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Pulsate the bubble size slightly
      Animated.loop(
        Animated.sequence([
          Animated.timing(bubbleSize, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(bubbleSize, {
            toValue: 0.95,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [calibrationPhase, bubblePosition, bubbleSize]);

  const startCalibration = () => {
    setCalibrationPhase('hold');
    
    if (vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setTimeout(() => {
      setCalibrationPhase('calibrating');

      if (vibrationEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const animationRef = Animated.timing(animatedValue, {
        toValue: 100,
        duration,
        useNativeDriver: false,
      });

      animationRef.start(({ finished }) => {
        if (finished) {
          setCalibrationPhase('complete');

          if (vibrationEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          setTimeout(() => {
            onCalibrationComplete();
          }, 500);
        }
      });
    }, 1000);
  };

  useEffect(() => {
    if (calibrationPhase === 'prepare') return;
    
    const interval = setInterval(() => {
      animatedValue.addListener(({ value }) => {
        setProgress(value);

        if (vibrationEnabled && value > 0) {
          const progressStep = Math.floor(value / 20); // More frequent feedback
          const now = Date.now();

          if (
            progressStep > Math.floor(lastHapticRef.current / 20) &&
            now - lastHapticRef.current > 300
          ) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            lastHapticRef.current = value;
          }
        }
      });
    }, 50);

    return () => {
      clearInterval(interval);
      animatedValue.removeAllListeners();
    };
  }, [animatedValue, duration, onCalibrationComplete, vibrationEnabled, calibrationPhase]);

  const progressWidth = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const getPhaseContent = () => {
    switch (calibrationPhase) {
      case 'prepare':
        return {
          icon: 'cellphone-information',
          title: 'Let\'s Set Up Tilt Controls',
          subtitle: 'Place your device on a flat surface, then tap the button to start calibration',
          buttonText: 'Start Calibration',
        };
      case 'hold':
        return {
          icon: 'cellphone',
          title: 'Hold Device Still',
          subtitle: 'Preparing to calibrate...',
        };
      case 'calibrating':
        return {
          icon: 'cellphone-settings',
          title: 'Keep Steady',
          subtitle: 'Finding your neutral position...',
        };
      case 'complete':
        return {
          icon: 'check-circle-outline',
          title: 'Calibration Complete',
          subtitle: 'Tilt controls are ready! Tilt your device to move the ball.',
        };
      default:
        return {
          icon: 'cellphone',
          title: 'Hold Device Still',
          subtitle: 'Calibrating tilt controls...',
        };
    }
  };

  const { icon, title, subtitle, buttonText } = getPhaseContent();

  const containerScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.spring(containerScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const renderLevelIndicator = () => {
    if (calibrationPhase !== 'calibrating') return null;
    
    return (
      <View style={styles.levelContainer}>
        <View style={[styles.levelBar, { backgroundColor: colors.surfaceVariant }]}>
          <Animated.View 
            style={[
              styles.levelBubble, 
              { 
                backgroundColor: colors.primary,
                transform: [
                  { translateX: bubblePosition },
                  { scale: bubbleSize }
                ] 
              }
            ]} 
          />
          <View style={styles.centerMark} />
        </View>
        <Text style={[styles.levelText, { color: colors.onSurfaceVariant }]}>
          Finding level position...
        </Text>
      </View>
    );
  };
  
  const renderTiltInstructions = () => {
    if (calibrationPhase !== 'prepare') return null;
    
    return (
      <View style={styles.instructionsContainer}>
        <Animated.View
          style={[
            styles.phoneImageContainer,
            {
              transform: [{ rotate: phoneTiltAnim.interpolate({
                inputRange: [-10, 10],
                outputRange: ['-10deg', '10deg']
              })}]
            }
          ]}
        >
          <MaterialCommunityIcons
            name="cellphone"
            size={80}
            color={colors.primary}
          />
        </Animated.View>
        <View style={styles.instructionTextContainer}>
          <Text style={[styles.instructionText, { color: colors.onSurfaceVariant }]}>
            • Place device on a flat surface
          </Text>
          <Text style={[styles.instructionText, { color: colors.onSurfaceVariant }]}>
            • Keep it still during calibration
          </Text>
          <Text style={[styles.instructionText, { color: colors.onSurfaceVariant }]}>
            • After calibration, tilt to move
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => setShowTips(!showTips)}
          style={styles.tipsButton}
        >
          <MaterialCommunityIcons
            name={showTips ? "chevron-up" : "chevron-down"} 
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.tipsButtonText, { color: colors.primary }]}>
            {showTips ? "Hide Tips" : "Show Tips"}
          </Text>
        </TouchableOpacity>
        
        {showTips && (
          <View style={styles.tipsContainer}>
            <Text style={[styles.tipText, { color: colors.onSurfaceVariant }]}>
              • Smaller tilts = finer control
            </Text>
            <Text style={[styles.tipText, { color: colors.onSurfaceVariant }]}>
              • Recalibrate if playing position changes
            </Text>
            <Text style={[styles.tipText, { color: colors.onSurfaceVariant }]}>
              • Adjust sensitivity in settings if needed
            </Text>
          </View>
        )}
      </View>
    );
  };

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
          
          {renderTiltInstructions()}
          {renderLevelIndicator()}
          
          {calibrationPhase !== 'prepare' && (
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
          )}
          
          {calibrationPhase === 'prepare' ? (
            <Button 
              mode="contained" 
              onPress={startCalibration}
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              {buttonText}
            </Button>
          ) : (
            <Text style={[styles.percentage, { color: colors.onSurfaceVariant }]}>
              {Math.round(progress)}%
            </Text>
          )}
          
          {calibrationPhase === 'complete' && onManualRecalibrate && (
            <Button 
              mode="outlined" 
              onPress={onManualRecalibrate}
              style={styles.recalibrateButton}
            >
              Recalibrate
            </Button>
          )}
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
  button: {
    marginTop: 16,
    width: '100%',
  },
  buttonLabel: {
    fontSize: 16,
    paddingVertical: 4,
  },
  recalibrateButton: {
    marginTop: 16,
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  phoneImageContainer: {
    marginBottom: 16,
  },
  instructionTextContainer: {
    width: '100%',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 6,
  },
  tipsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  tipsButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  tipsContainer: {
    width: '100%',
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  tipText: {
    fontSize: 13,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  levelContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBar: {
    width: '80%',
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    position: 'relative',
  },
  levelBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    top: -2,
    left: '50%',
    marginLeft: -12,
  },
  centerMark: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginLeft: -1,
  },
  levelText: {
    marginTop: 8,
    fontSize: 14,
  },
});

export default React.memo(TiltCalibrationOverlay);
