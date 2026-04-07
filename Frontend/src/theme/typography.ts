// src/theme/typography.ts

import { StyleSheet } from 'react-native';

export const FONTS = {
  // Using system fonts since we can't load custom fonts without expo-font config
  // These map to the best available system fonts on iOS/Android
  regular: 'System',
  medium: 'System',
  bold: 'System',
  mono: 'Courier New',
};

export const TYPOGRAPHY = StyleSheet.create({
  displayLarge: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 42,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  headingLarge: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  headingMedium: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  mono: {
    fontFamily: 'Courier New',
    fontSize: 14,
    lineHeight: 20,
  },
});