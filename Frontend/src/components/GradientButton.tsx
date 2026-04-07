// src/components/GradientButton.tsx
// Animated gradient button with press feedback and glow effect

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SPACING } from '../theme/spacing';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  gradientColors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  icon,
  gradientColors = [COLORS.primary, COLORS.primaryDark],
  style,
  textStyle,
  loading = false,
  disabled = false,
  size = 'lg',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 30,
        bounciness: 4,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (!loading && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const heightMap = { sm: 44, md: 52, lg: 60 };
  const fontSizeMap = { sm: 14, md: 15, lg: 16 };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        style={styles.touchable}
      >
        <LinearGradient
          colors={disabled ? ['#2A2A45', '#1E1E35'] : gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { height: heightMap[size] }]}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <View style={styles.content}>
              {icon && <View style={styles.icon}>{icon}</View>}
              <Text
                style={[
                  styles.text,
                  { fontSize: fontSizeMap[size] },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  touchable: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  gradient: {
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  icon: {
    marginRight: 2,
  },
  text: {
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 0.3,
    ...TYPOGRAPHY.labelLarge,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default GradientButton;