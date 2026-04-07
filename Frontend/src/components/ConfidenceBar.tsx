// src/components/ConfidenceBar.tsx
// Animated horizontal progress bar for confidence scores

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SPACING } from '../theme/spacing';

interface ConfidenceBarProps {
  label: string;
  value: number; // 0.0 – 1.0
  color: string;
  isPrimary?: boolean;
  delay?: number;
}

const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  label,
  value,
  color,
  isPrimary = false,
  delay = 0,
}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: value,
      duration: 800,
      delay,
      useNativeDriver: false, // width can't use native driver
    }).start();
  }, [value]);

  const percentage = Math.round(value * 100);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, isPrimary && { color: COLORS.textPrimary, fontWeight: '700' }]}>
          {label}
        </Text>
        <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              opacity: isPrimary ? 1 : 0.6,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  percentage: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
  },
  track: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
});

export default ConfidenceBar;