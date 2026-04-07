// src/screens/HistoryScreen.tsx
// Shows the user's history of analyzed audio files with delete and re-view support

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';

import BackButton from '../components/BackButton';
import Toast, { ToastRef } from '../components/Toast';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { HistoryItem, EmotionType } from '../types/emotion';
import { EMOTION_CONFIG } from '../constants/emotionConfig';
import { getHistory, deleteHistoryItem, clearHistory } from '../services/historyService';
import { RootStackParamList } from '../types/navigation';

type Nav = StackNavigationProp<RootStackParamList>;

/** Format a timestamp as a relative or absolute date string */
function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface HistoryRowProps {
  item: HistoryItem;
  onPress: () => void;
  onDelete: () => void;
}

/** Individual history list row */
const HistoryRow: React.FC<HistoryRowProps> = ({ item, onPress, onDelete }) => {
  const config = EMOTION_CONFIG[item.emotion as EmotionType] ?? EMOTION_CONFIG.neutral;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onDelete}
        activeOpacity={1}
      >
        {/* Emotion icon */}
        <View style={[styles.rowIcon, { backgroundColor: config.glow }]}>
          <Text style={styles.rowEmoji}>{config.emoji}</Text>
        </View>

        {/* Content */}
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.rowEmotion, { color: config.color }]}>
              {config.label}
            </Text>
            <View style={[styles.confidencePill, { backgroundColor: config.glow }]}>
              <Text style={[styles.confidencePillText, { color: config.color }]}>
                {Math.round(item.confidence * 100)}%
              </Text>
            </View>
          </View>
          <Text style={styles.rowFile} numberOfLines={1}>
            {item.audioName}
          </Text>
          <Text style={styles.rowDate}>{formatDate(item.timestamp)}</Text>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const toastRef = useRef<ToastRef>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── Load / Refresh ───────────────────────────────────────────

  const loadHistory = async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);

    const data = await getHistory();
    setHistory(data);

    setIsLoading(false);
    setIsRefreshing(false);
  };

  // Reload whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  // ─── Delete Single Item ───────────────────────────────────────

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Entry', 'Remove this entry from your history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteHistoryItem(id);
          setHistory((prev) => prev.filter((h) => h.id !== id));
          toastRef.current?.show('Entry removed', 'info', 2000);
        },
      },
    ]);
  };

  // ─── Clear All ────────────────────────────────────────────────

  const handleClearAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Clear All History',
      `This will permanently delete all ${history.length} entries. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            setHistory([]);
            toastRef.current?.show('History cleared', 'success');
          },
        },
      ]
    );
  };

  // ─── Navigate to Result ───────────────────────────────────────

  const handleViewResult = (item: HistoryItem) => {
    navigation.navigate('Result', {
      emotion: item.emotion,
      confidence: item.confidence,
      audioName: item.audioName,
      timestamp: item.timestamp,
    });
  };

  // ─── Stats ────────────────────────────────────────────────────

  const stats = React.useMemo(() => {
    if (!history.length) return null;
    // Most common emotion
    const counts: Record<string, number> = {};
    history.forEach((h) => { counts[h.emotion] = (counts[h.emotion] ?? 0) + 1; });
    const topEmotion = Object.entries(counts).sort(([, a], [, b]) => b - a)[0];
    const avgConf = history.reduce((s, h) => s + h.confidence, 0) / history.length;
    return { topEmotion, avgConf };
  }, [history]);

  // ─── Render ───────────────────────────────────────────────────

  const renderEmpty = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="time-outline" size={48} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No History Yet</Text>
      <Text style={styles.emptySubtitle}>
        Record or upload audio files to see your analysis history here.
      </Text>
      <TouchableOpacity
        style={styles.emptyAction}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.emptyActionText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>History</Text>
          {history.length > 0 ? (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        {/* Stats summary */}
        {stats && history.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{history.length}</Text>
              <Text style={styles.statLabel}>Analyses</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {EMOTION_CONFIG[stats.topEmotion[0] as EmotionType]?.emoji ?? '?'}
                {' '}{EMOTION_CONFIG[stats.topEmotion[0] as EmotionType]?.label ?? stats.topEmotion[0]}
              </Text>
              <Text style={styles.statLabel}>Most Common</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(stats.avgConf * 100)}%</Text>
              <Text style={styles.statLabel}>Avg. Accuracy</Text>
            </View>
          </View>
        )}

        {/* List */}
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryRow
              item={item}
              onPress={() => handleViewResult(item)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          ListEmptyComponent={!isLoading ? renderEmpty : null}
          contentContainerStyle={[
            styles.listContent,
            history.length === 0 && styles.listEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadHistory(true)}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />

        {history.length > 0 && (
          <Text style={styles.longPressHint}>Long press an entry to delete it</Text>
        )}
      </SafeAreaView>

      <Toast ref={toastRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: { ...TYPOGRAPHY.headingMedium, color: COLORS.textPrimary },
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: `${COLORS.error}18`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.error}33`,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    ...TYPOGRAPHY.headingMedium,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  statLabel: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textMuted,
    textTransform: 'none',
    fontSize: 10,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },

  // List
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  listEmpty: {
    flex: 1,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rowEmoji: { fontSize: 26 },
  rowBody: { flex: 1, gap: 3 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowEmotion: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '700',
  },
  confidencePill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  confidencePillText: {
    ...TYPOGRAPHY.labelSmall,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'none',
  },
  rowFile: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  rowDate: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
  },

  separator: {
    height: SPACING.sm,
  },

  // Empty state
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.xxxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    ...TYPOGRAPHY.headingLarge,
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.xl,
  },
  emptyAction: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  emptyActionText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.white,
  },

  longPressHint: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
});