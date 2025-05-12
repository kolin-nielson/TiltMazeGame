import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  backgroundColor?: string;
  textColor?: string;
  showDuration?: number;
  width?: number;
}
const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  position = 'bottom',
  backgroundColor = 'rgba(33, 33, 33, 0.9)',
  textColor = 'white',
  showDuration = 2000,
  width = 150,
}) => {
  const [visible, setVisible] = useState(false);
  const opacity = useSharedValue(0);
  const tooltipTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const showTooltip = () => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
    setVisible(true);
    opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    tooltipTimeout.current = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, () => {
        setVisible(false);
      });
    }, showDuration);
  };
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: opacity.value * 0.05 + 0.95 }],
  }));
  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return { bottom: '100%', marginBottom: 8, alignSelf: 'center' };
      case 'bottom':
        return { top: '100%', marginTop: 8, alignSelf: 'center' };
      case 'left':
        return { right: '100%', marginRight: 8, alignSelf: 'center' };
      case 'right':
        return { left: '100%', marginLeft: 8, alignSelf: 'center' };
      default:
        return { top: '100%', marginTop: 8, alignSelf: 'center' };
    }
  };
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={showTooltip} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
      {visible && (
        <Animated.View
          style={[styles.tooltip, { backgroundColor, width }, getPositionStyle(), animatedStyle]}
        >
          <Text style={[styles.tooltipText, { color: textColor }]}>{text}</Text>
        </Animated.View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  tooltipText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
export default Tooltip;
