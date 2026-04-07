// src/components/Toast.tsx
// Animated toast notification system

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SPACING } from '../theme/spacing';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastRef {
  show: (message: string, type?: ToastType, duration?: number) => void;
}

interface ToastState {
  message: string;
  type: ToastType;
}

const ICON_MAP: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
  warning: 'warning',
};

const COLOR_MAP: Record<ToastType, string> = {
  success: COLORS.success,
  error: COLORS.error,
  info: COLORS.secondary,
  warning: COLORS.warning,
};

const Toast = forwardRef<ToastRef>((_, ref) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [state, setState] = React.useState<ToastState>({
    message: '',
    type: 'info',
  });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    setState({ message, type });

    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, duration);
  };

  useImperativeHandle(ref, () => ({ show }));

  const accentColor = COLOR_MAP[state.type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          borderLeftColor: accentColor,
        },
      ]}
      pointerEvents="none"
    >
      <Ionicons name={ICON_MAP[state.type]} size={20} color={accentColor} />
      <Text style={styles.message} numberOfLines={2}>
        {state.message}
      </Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderLeftWidth: 4,
    zIndex: 9999,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  message: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    flex: 1,
  },
});

export default Toast;