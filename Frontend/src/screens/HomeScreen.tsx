// src/screens/HomeScreen.tsx
// Main landing screen with animated entrance and navigation to record/upload

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import GradientButton from '../components/GradientButton';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { RootStackParamList } from '../types/navigation';

const { width, height } = Dimensions.get('window');
type Nav = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();

  // Entrance animation values
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance sequence
    Animated.stagger(180, [
      Animated.spring(titleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }),
      Animated.spring(subtitleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }),
      Animated.spring(buttonsAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 6,
      }),
    ]).start();

    // Ambient glow pulse loop
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.9, duration: 2200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2200, useNativeDriver: true }),
      ])
    );
    glow.start();

    // Subtle logo floating animation
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(logoRotate, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    );
    float.start();

    return () => {
      glow.stop();
      float.stop();
    };
  }, []);

  const floatY = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Ambient background blobs */}
      <Animated.View style={[styles.blob1, { opacity: glowAnim }]} />
      <Animated.View style={[styles.blob2, { opacity: glowAnim }]} />
      <View style={styles.gridOverlay} />

      <SafeAreaView style={styles.safe}>
        {/* Top bar */}
        <View style={styles.header}>
          <View style={styles.versionBadge}>
            <View style={styles.versionDot} />
            <Text style={styles.versionText}></Text>
          </View>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.75}
          >
            <Ionicons name="time-outline" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Hero section */}
        <View style={styles.hero}>
          {/* Animated logo */}
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                opacity: titleAnim,
                transform: [
                  {
                    translateY: Animated.add(
                      titleAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }),
                      floatY
                    ),
                  },
                ],
              },
            ]}
          >
            <Animated.View style={[styles.logoGlow, { opacity: glowAnim }]} />
            <LinearGradient
              colors={[COLORS.recordActive, COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="mic" size={52} color={COLORS.white} />
            </LinearGradient>
            {/* Orbiting dot */}
            <Animated.View
              style={[
                styles.orbitDot,
                {
                  transform: [
                    {
                      rotate: logoRotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.orbitDotInner} />
            </Animated.View>
          </Animated.View>

          {/* Title */}
          <Animated.View
            style={{
              opacity: titleAnim,
              transform: [{
                translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
              }],
            }}
          >
            <Text style={styles.title}>Emotion</Text>
            <Text style={styles.titleAccent}>Detector</Text>
          </Animated.View>

          {/* Subtitle */}
          <Animated.Text
            style={[
              styles.subtitle,
              {
                opacity: subtitleAnim,
                transform: [{
                  translateY: subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
                }],
              },
            ]}
          >
            Detect emotions in your voice{'\n'}using AI-powered audio analysis
          </Animated.Text>

          {/* Emotion chips */}
          <Animated.View style={[styles.emotionChips, { opacity: subtitleAnim }]}>
            {[
              { label: 'Happy', emoji: '😊', color: COLORS.happy },
              { label: 'Sad', emoji: '😢', color: COLORS.sad },
              { label: 'Angry', emoji: '😠', color: COLORS.angry },
              { label: 'Neutral', emoji: '😐', color: COLORS.neutral },
            ].map((item) => (
              <View
                key={item.label}
                style={[styles.chip, { borderColor: item.color + '55' }]}
              >
                <Text style={styles.chipEmoji}>{item.emoji}</Text>
                <Text style={[styles.chipLabel, { color: item.color }]}>{item.label}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Action buttons */}
        <Animated.View
          style={[
            styles.buttons,
            {
              opacity: buttonsAnim,
              transform: [{
                translateY: buttonsAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }),
              }],
            },
          ]}
        >
          {/* Record button */}
          <GradientButton
            title="Record Audio"
            onPress={() => navigation.navigate('Record')}
            gradientColors={[COLORS.recordActive, '#C62A47']}
            icon={<Ionicons name="mic" size={22} color={COLORS.white} />}
          />

          {/* Random sample button */}
          <GradientButton
            title="Random Dataset Sample"
            onPress={() => navigation.navigate('Upload')}
            gradientColors={[COLORS.primary, COLORS.primaryDark]}
            icon={<Ionicons name="dice" size={22} color={COLORS.white} />}
          />

          {/* Supported formats */}
          <View style={styles.formatsRow}>
            <Text style={styles.formatsLabel}>Supports:</Text>
            {['MP3', 'WAV', 'M4A', 'AAC', 'OGG', 'FLAC'].map((fmt) => (
              <View key={fmt} style={styles.formatTag}>
                <Text style={styles.formatText}>{fmt}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Text style={styles.footer}>
          All processing is done server-side · Your audio is never stored
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safe: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },

  // Background effects
  blob1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: COLORS.primaryGlow,
    top: -100,
    left: -100,
  },
  blob2: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.secondaryGlow,
    bottom: 80,
    right: -80,
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    opacity: 0.03,
    // Subtle dot grid — achieved via background pattern
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  versionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  versionText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textSecondary,
    textTransform: 'none',
    letterSpacing: 0.3,
  },
  historyBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Hero
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xl,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  logoGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.primaryGlow,
    top: -25,
    left: -25,
    zIndex: -1,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitDot: {
    position: 'absolute',
    width: 130,
    height: 130,
    top: -15,
    left: -15,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  orbitDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.secondary,
    marginTop: 2,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -2,
    lineHeight: 52,
  },
  titleAccent: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: -2,
    lineHeight: 54,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  emotionChips: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderWidth: 1,
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: {
    ...TYPOGRAPHY.labelSmall,
    textTransform: 'none',
    letterSpacing: 0.2,
    fontSize: 12,
  },

  // Buttons
  buttons: {
    gap: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  formatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    flexWrap: 'wrap',
  },
  formatsLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
  },
  formatTag: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formatText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textMuted,
    fontSize: 10,
  },

  footer: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingBottom: SPACING.lg,
    lineHeight: 18,
  },
});
