import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { ThemeColors } from '@types';
interface SimpleDeathScreenProps {
  visible: boolean;
  onAnimationComplete: () => void;
  colors: ThemeColors;
}
const ANIMATION_DURATION = 1200;
const SimpleDeathScreen: React.FC<SimpleDeathScreenProps> = ({
  visible,
  onAnimationComplete,
  colors,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1.2);
  const iconScale = useSharedValue(0.5);
  useEffect(() => {
    if (visible) {
      opacity.value = 0;
      scale.value = 1.2;
      iconScale.value = 0.5;
      opacity.value = withSequence(
        withTiming(0.8, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(
          1,
          {
            duration: ANIMATION_DURATION - 300,
            easing: Easing.inOut(Easing.cubic),
          },
          () => {
            runOnJS(onAnimationComplete)();
          }
        )
      );
      scale.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
      iconScale.value = withTiming(1, {
        duration: 500,
        easing: Easing.elastic(1.2),
      });
    }
  }, [visible, opacity, scale, iconScale, onAnimationComplete]);
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: iconScale.value }],
  }));
  if (!visible) return null;
  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[styles.overlay, { backgroundColor: colors.errorContainer }, overlayStyle]}
      />
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        <View style={[styles.xLine, { backgroundColor: colors.onErrorContainer }]} />
        <View
          style={[styles.xLine, styles.xLineRotated, { backgroundColor: colors.onErrorContainer }]}
        />
      </Animated.View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  xLine: {
    position: 'absolute',
    width: 80,
    height: 10,
    borderRadius: 5,
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  xLineRotated: {
    transform: [{ rotate: '-45deg' }],
  },
});
export default React.memo(SimpleDeathScreen);
