// src/components/WaveformAnimation.tsx
// Animated waveform bars shown during audio recording

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../theme/colors';

interface WaveformAnimationProps {
  isActive: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}

const WaveformAnimation: React.FC<WaveformAnimationProps> = ({
  isActive,
  color = COLORS.recordActive,
  barCount = 32,
  height = 60,
}) => {
  // Each bar has its own animated value
  const animations = useRef<Animated.Value[]>(
    Array.from({ length: barCount }, () => new Animated.Value(0.15))
  ).current;

  const loopRefs = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    if (isActive) {
      // Start staggered animations for each bar
      loopRefs.current = animations.map((anim, i) => {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.delay(i * 40), // stagger
            Animated.timing(anim, {
              toValue: 0.2 + Math.random() * 0.8,
              duration: 300 + Math.random() * 300,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.1 + Math.random() * 0.3,
              duration: 300 + Math.random() * 300,
              useNativeDriver: true,
            }),
          ])
        );
        loop.start();
        return loop;
      });
    } else {
      // Stop all animations and collapse bars
      loopRefs.current.forEach((loop) => loop.stop());
      animations.forEach((anim) => {
        Animated.spring(anim, {
          toValue: 0.15,
          useNativeDriver: true,
          speed: 10,
        }).start();
      });
    }

    return () => {
      loopRefs.current.forEach((loop) => loop.stop());
    };
  }, [isActive]);

  return (
    <View style={[styles.container, { height }]}>
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              transform: [{ scaleY: anim }],
              opacity: isActive ? anim : 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
  },
  bar: {
    width: 3,
    height: '100%',
    borderRadius: 2,
  },
});

export default WaveformAnimation;