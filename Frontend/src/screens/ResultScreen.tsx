// src/screens/ResultScreen.tsx
// Displays the emotion analysis result with animated visuals, confidence breakdown, and share option

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Share,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';

import BackButton from '../components/BackButton';
import GradientButton from '../components/GradientButton';
import ConfidenceBar from '../components/ConfidenceBar';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { RootStackParamList } from '../types/navigation';
import { EMOTION_CONFIG } from '../constants/emotionConfig';
import { EmotionType } from '../types/emotion';

type RouteType = RouteProp<RootStackParamList, 'Result'>;
type Nav = StackNavigationProp<RootStackParamList>;

/** Generate deterministic-looking mock scores for other emotions */
function buildMockScores(
  primaryEmotion: EmotionType,
  primaryConfidence: number
): Record<EmotionType, number> {
  const all: EmotionType[] = [
    'happy', 'sad', 'angry', 'neutral', 'fearful', 'disgusted', 'surprised',
  ];
  const scores: Partial<Record<EmotionType, number>> = {
    [primaryEmotion]: primaryConfidence,
  };

  // Distribute remaining probability across others
  const remaining = 1 - primaryConfidence;
  const others = all.filter((e) => e !== primaryEmotion);
  // Fixed distribution for visual consistency (not random per render)
  const weights = [0.35, 0.25, 0.18, 0.12, 0.06, 0.04];
  others.forEach((e, i) => {
    scores[e] = parseFloat((remaining * (weights[i] ?? 0.02)).toFixed(3));
  });

  return scores as Record<EmotionType, number>;
}

export default function ResultScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<Nav>();
  const { emotion, confidence, audioName, timestamp, actualEmotion, isCorrect } = route.params;

  const emotionKey = (emotion?.toLowerCase() ?? 'neutral') as EmotionType;
  const config = EMOTION_CONFIG[emotionKey] ?? EMOTION_CONFIG.neutral;
  const percentage = Math.round(confidence * 100);

  // Stable mock scores (memoized so they don't change on re-render)
  const allScores = useMemo(
    () => buildMockScores(emotionKey, confidence),
    [emotionKey, confidence]
  );

  // Sorted scores for display
  const sortedScores = useMemo(
    () =>
      (Object.entries(allScores) as [EmotionType, number][])
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6),
    [allScores]
  );

  // ─── Animations ───────────────────────────────────────────────
  const heroAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Trigger haptic on result load
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Staggered entrance
    Animated.stagger(150, [
      Animated.spring(heroAnim, {
        toValue: 1, useNativeDriver: true, speed: 10, bounciness: 6,
      }),
      Animated.spring(emojiScale, {
        toValue: 1, useNativeDriver: true, speed: 8, bounciness: 14,
      }),
      Animated.spring(cardAnim, {
        toValue: 1, useNativeDriver: true, speed: 12, bounciness: 6,
      }),
    ]).start();

    // Glow pulse
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1600, useNativeDriver: true }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, []);

  // ─── Share ────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      await Share.share({
        message: [
          `🎙️ Emotion Detector Result`,
          `Emotion: ${config.label} ${config.emoji}`,
          `Confidence: ${percentage}%`,
          `File: ${audioName}`,
          `Analyzed: ${new Date(timestamp).toLocaleString()}`,
        ].join('\n'),
        title: 'Emotion Analysis Result',
      });
    } catch {}
  };

  const formattedDate = new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Confidence tier label
  const confidenceTier =
    percentage >= 85 ? { label: 'High Confidence', color: COLORS.success }
    : percentage >= 65 ? { label: 'Medium Confidence', color: COLORS.warning }
    : { label: 'Low Confidence', color: COLORS.error };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Analysis Result</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero Emotion Card ── */}
          <Animated.View
            style={[
              styles.heroCardWrapper,
              {
                opacity: heroAnim,
                transform: [{
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1], outputRange: [40, 0],
                  }),
                }],
              },
            ]}
          >
            {/* Glow background */}
            <Animated.View
              style={[
                styles.heroGlow,
                { backgroundColor: config.color, opacity: Animated.multiply(glowAnim, new Animated.Value(0.15)) },
              ]}
            />

            <LinearGradient
              colors={[COLORS.surfaceElevated, COLORS.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.heroCard, { borderColor: config.color + '44' }]}
            >
              {/* Emoji */}
              <Animated.Text
                style={[
                  styles.emoji,
                  { transform: [{ scale: emojiScale }] },
                ]}
              >
                {config.emoji}
              </Animated.Text>

              {/* Emotion label */}
              <Text style={[styles.emotionLabel, { color: config.color }]}>
                {config.label}
              </Text>

              {/* Description */}
              <Text style={styles.description}>{config.description}</Text>

              {/* Confidence badge */}
              <View style={styles.confidenceRow}>
                <View style={[styles.confidenceBadge, { backgroundColor: config.color + '22' }]}>
                  <Text style={[styles.confidencePercent, { color: config.color }]}>
                    {percentage}%
                  </Text>
                  <Text style={[styles.confidenceLabel, { color: config.color + 'BB' }]}>
                    confidence
                  </Text>
                </View>
                <View style={[styles.tierBadge, { backgroundColor: confidenceTier.color + '22' }]}>
                  <View style={[styles.tierDot, { backgroundColor: confidenceTier.color }]} />
                  <Text style={[styles.tierText, { color: confidenceTier.color }]}>
                    {confidenceTier.label}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Score Breakdown ── */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardAnim,
                transform: [{
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1], outputRange: [30, 0],
                  }),
                }],
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="bar-chart-outline" size={18} color={COLORS.secondary} />
              <Text style={styles.cardTitle}>Emotion Breakdown</Text>
            </View>

            {sortedScores.map(([e, score], i) => {
              const cfg = EMOTION_CONFIG[e] ?? EMOTION_CONFIG.neutral;
              return (
                <ConfidenceBar
                  key={e}
                  label={`${cfg.emoji}  ${cfg.label}`}
                  value={score}
                  color={cfg.color}
                  isPrimary={e === emotionKey}
                  delay={i * 80}
                />
              );
            })}
          </Animated.View>

          {/* ── Predicted vs Actual ── */}
          {actualEmotion && (
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: cardAnim,
                  borderColor: isCorrect ? COLORS.success + '55' : COLORS.error + '55',
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons
                  name={isCorrect ? 'checkmark-circle-outline' : 'close-circle-outline'}
                  size={18}
                  color={isCorrect ? COLORS.success : COLORS.error}
                />
                <Text style={styles.cardTitle}>Prediction Check</Text>
                <View style={[styles.matchBadge, { backgroundColor: isCorrect ? COLORS.success + '22' : COLORS.error + '22' }]}>
                  <Text style={[styles.matchBadgeText, { color: isCorrect ? COLORS.success : COLORS.error }]}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </Text>
                </View>
              </View>

              <View style={styles.vsRow}>
                <View style={styles.vsItem}>
                  <Text style={styles.vsLabel}>Predicted</Text>
                  <Text style={[styles.vsEmotion, { color: config.color }]}>
                    {(EMOTION_CONFIG[emotionKey] ?? EMOTION_CONFIG.neutral).emoji}{'  '}{config.label}
                  </Text>
                </View>

                <View style={styles.vsDivider}>
                  <Text style={styles.vsText}>vs</Text>
                </View>

                <View style={styles.vsItem}>
                  <Text style={styles.vsLabel}>Actual</Text>
                  {(() => {
                    const actualKey = actualEmotion.toLowerCase() as EmotionType;
                    const actualCfg = EMOTION_CONFIG[actualKey] ?? EMOTION_CONFIG.neutral;
                    return (
                      <Text style={[styles.vsEmotion, { color: actualCfg.color }]}>
                        {actualCfg.emoji}{'  '}{actualCfg.label}
                      </Text>
                    );
                  })()}
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Analysis Metadata ── */}
          <Animated.View
            style={[
              styles.card,
              { opacity: cardAnim },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.secondary} />
              <Text style={styles.cardTitle}>Details</Text>
            </View>

            {[
              { icon: 'document-text-outline', label: 'File', value: audioName },
              { icon: 'time-outline', label: 'Analyzed', value: formattedDate },
              {
                icon: 'analytics-outline',
                label: 'Accuracy',
                value: `${percentage}% — ${confidenceTier.label}`,
              },
            ].map((row, i) => (
              <View key={i}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.metaRow}>
                  <Ionicons
                    name={row.icon as any}
                    size={16}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.metaLabel}>{row.label}</Text>
                  <Text style={styles.metaValue} numberOfLines={1}>
                    {row.value}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* ── Actions ── */}
          <Animated.View style={[styles.actions, { opacity: cardAnim }]}>
            <GradientButton
              title="Try Again"
              onPress={() => navigation.popToTop()}
              gradientColors={[COLORS.primary, COLORS.primaryDark]}
              icon={<Ionicons name="refresh" size={20} color={COLORS.white} />}
            />

            <GradientButton
              title="View History"
              onPress={() => navigation.navigate('History')}
              gradientColors={[COLORS.surface, COLORS.surfaceElevated]}
              icon={<Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />}
              textStyle={{ color: COLORS.textPrimary }}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: { ...TYPOGRAPHY.headingMedium, color: COLORS.textPrimary },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xl,
  },

  // Hero card
  heroCardWrapper: {
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    inset: -20,
    borderRadius: RADIUS.xxl + 20,
    zIndex: -1,
  },
  heroCard: {
    borderRadius: RADIUS.xxl,
    borderWidth: 1.5,
    padding: SPACING.xxxl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  emoji: {
    fontSize: 90,
    lineHeight: 108,
    textAlign: 'center',
  },
  emotionLabel: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 48,
    textAlign: 'center',
  },
  description: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  confidenceRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  confidencePercent: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  confidenceLabel: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '500',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  tierDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  tierText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
  },

  // Shared card style
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    ...TYPOGRAPHY.headingMedium,
    color: COLORS.textPrimary,
  },

  // Meta rows
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  metaLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    width: 68,
    flexShrink: 0,
  },
  metaValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },

  // Actions
  actions: {
    gap: SPACING.md,
  },

  // Predicted vs Actual
  matchBadge: {
    marginLeft: 'auto',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
  },
  matchBadgeText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  vsItem: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  vsLabel: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  vsEmotion: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '700',
    textAlign: 'center',
  },
  vsDivider: {
    width: 32,
    alignItems: 'center',
  },
  vsText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});