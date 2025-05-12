import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  Platform,
} from 'react-native';
import { useAppSelector, RootState } from '@store';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
export type ButtonSize = 'small' | 'medium' | 'large';
interface ButtonProps extends TouchableOpacityProps {
  title: string;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingColor?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
const Button: React.FC<ButtonProps> = ({
  title,
  containerStyle,
  textStyle,
  variant = 'primary',
  size = 'medium',
  loading = false,
  loadingColor,
  disabled = false,
  leftIcon,
  rightIcon,
  onPress,
  ...rest
}) => {
  const themeColors = useAppSelector((state: RootState) => state.theme.colors);
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      opacity: disabled ? 0.5 : 1,
    };
    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: themeColors.primary,
          borderColor: themeColors.primary,
          borderWidth: 1,
          ...getShadowStyle(3),
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: themeColors.secondary,
          borderColor: themeColors.secondary,
          borderWidth: 1,
          ...getShadowStyle(2),
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderColor: themeColors.primary,
          borderWidth: 1,
          ...getShadowStyle(1),
        };
      case 'text':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return baseStyle;
    }
  };
  const getShadowStyle = (elevation: number): ViewStyle => {
    if (Platform.OS === 'ios') {
      return {
        shadowColor: themeColors.onBackground,
        shadowOffset: { width: 0, height: elevation },
        shadowOpacity: 0.1 + elevation * 0.03,
        shadowRadius: elevation,
      };
    } else {
      return {
        elevation,
      };
    }
  };
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
        };
      case 'medium':
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
        };
    }
  };
  const getTextColor = (): string => {
    switch (variant) {
      case 'outline':
      case 'text':
        return themeColors.primary;
      default:
        return themeColors.onPrimary;
    }
  };
  const getTextSize = (): number => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      case 'medium':
      default:
        return 16;
    }
  };
  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), getSizeStyle(), containerStyle]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={variant === 'text' ? 0.5 : 0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={
            loadingColor || (variant === 'outline' ? themeColors.primary : themeColors.onPrimary)
          }
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getTextSize(),
                marginLeft: leftIcon ? 8 : 0,
                marginRight: rightIcon ? 8 : 0,
                letterSpacing: 0.25,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
export default Button;
