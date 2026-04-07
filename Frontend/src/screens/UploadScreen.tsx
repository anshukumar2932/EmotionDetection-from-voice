// src/screens/UploadScreen.tsx
// Picks a random audio sample from the dataset and analyzes it

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';

import BackButton from '../components/BackButton';
import GradientButton from '../components/GradientButton';
import Toast, { ToastRef } from '../components/Toast';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { RootStackParamList } from '../types/navigation';
import { analyzeRandomSample } from '../services/emotionApi';
import { addHistoryItem } from '../services/historyService';
import { EmotionType } from '../types/emotion';

type Nav = StackNavigationProp<RootStackParamList>;

const MODELS = [
  { key: 'anshu_cnn_lstm_attention', label: 'CNN-LSTM+Attention', dataset: 'RAVDESS', accuracy: '93%' },
  { key: 'anshu_cnn_lstm',           label: 'CNN-LSTM',           dataset: 'RAVDESS', accuracy: '88%' },
  { key: 'shantam_ensemble',         label: 'Ensemble MLP+SVM+RF', dataset: 'RAVDESS', accuracy: '85%' },
  { key: 'arpit_cnn_lstm',           label: 'CNN-LSTM',           dataset: 'CREMA-D', accuracy: '80%' },
  { key: 'durgesh_svm',              label: 'SVM',                dataset: 'SAVEE',   accuracy: '78%' },
  { key: 'keshav_rnn',               label: 'Bidirectional LSTM', dataset: 'CREMA-D', accuracy: '72%' },
];

export default function UploadScreen() {
  const navigation = useNavigation<Nav>();
  const toastRef = useRef<ToastRef>(null);

  const [selectedModel, setSelectedModel] = useState(MODELS[0].key);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const buttonAnim = useRef(new Animated.Value(1)).current;
  const diceAnim = useRef(new Animated.Value(0)).current;

  const spinDice = () => {
    diceAnim.setValue(0);
    Animated.timing(diceAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const handleRandomSample = async () => {
    Animated.sequence([
      Animated.timing(buttonAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(buttonAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();

    spinDice();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAnalyzing(true);

    try {
      const result = await analyzeRandomSample(selectedModel);

      if (result.success && result.result) {
        const { emotion, confidence } = result.result;
        const audioName = (result as any).audioName ?? 'random_sample.wav';
        const actualEmotion = (result as any).actualEmotion;
        const isCorrect = (result as any).isCorrect;
        const ts = new Date().toISOString();

        await addHistoryItem({
          id: Date.now().toString(),
          audioName,
          emotion: emotion as EmotionType,
          confidence,
          timestamp: ts,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate('Result', { emotion, confidence, audioName, timestamp: ts, actualEmotion, isCorrect });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        toastRef.current?.show(result.error ?? 'Analysis failed. Please try again.', 'error');
      }
    } catch (err) {
      toastRef.current?.show('An unexpected error occurred', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const diceRotate = diceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Random Sample</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Hero card */}
          <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
            <TouchableOpacity
              style={styles.heroCard}
              onPress={handleRandomSample}
              activeOpacity={0.85}
              disabled={isAnalyzing}
            >
              <LinearGradient
                colors={['rgba(124,92,252,0.10)', 'rgba(0,212,255,0.05)']}
                style={styles.heroGradient}
              >
                <Animated.View style={{ transform: [{ rotate: diceRotate }] }}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={styles.diceIcon}
                  >
                    <Ionicons name="dice" size={38} color={COLORS.white} />
                  </LinearGradient>
                </Animated.View>

                <Text style={styles.heroTitle}>
                  {isAnalyzing ? 'Picking a sample…' : 'Pick Random Sample'}
                </Text>
                <Text style={styles.heroSubtitle}>
                  The server picks a random audio file{'\n'}from the dataset and analyzes it
                </Text>

                <View style={[styles.goButton, isAnalyzing && styles.goButtonDisabled]}>
                  <Ionicons
                    name={isAnalyzing ? 'hourglass-outline' : 'shuffle'}
                    size={18}
                    color={COLORS.white}
                  />
                  <Text style={styles.goButtonText}>
                    {isAnalyzing ? 'Analyzing…' : 'Analyze Random File'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Model selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Select Model</Text>
            {MODELS.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.modelRow, selectedModel === m.key && styles.modelRowActive]}
                onPress={() => setSelectedModel(m.key)}
                activeOpacity={0.75}
              >
                <View style={styles.modelRadio}>
                  {selectedModel === m.key && <View style={styles.modelRadioDot} />}
                </View>
                <View style={styles.modelInfo}>
                  <Text style={styles.modelLabel}>{m.label}</Text>
                  <Text style={styles.modelDataset}>{m.dataset}</Text>
                </View>
                <View style={styles.accuracyBadge}>
                  <Text style={styles.accuracyText}>{m.accuracy}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Info card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.secondary} />
              <Text style={styles.infoTitle}>How it works</Text>
            </View>
            {[
              'Server picks a random .wav from the dataset',
              'Runs it through the selected model',
              'Returns the predicted emotion + confidence',
              'No file upload needed from your device',
            ].map((tip, i) => (
              <View key={i} style={styles.infoRow}>
                <View style={styles.infoDot} />
                <Text style={styles.infoText}>{tip}</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
      <Toast ref={toastRef} />
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
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xl,
  },

  // Hero card
  heroCard: {
    borderRadius: RADIUS.xxl,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '55',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  heroGradient: {
    alignItems: 'center',
    padding: SPACING.xxxl,
    gap: SPACING.lg,
  },
  diceIcon: {
    width: 80,
    height: 80,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    ...TYPOGRAPHY.headingMedium,
    color: COLORS.textPrimary,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  goButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  goButtonDisabled: {
    opacity: 0.6,
  },
  goButtonText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.white,
  },

  // Model selector
  section: { gap: SPACING.sm },
  sectionLabel: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modelRowActive: {
    borderColor: COLORS.primary + '88',
    backgroundColor: COLORS.primaryGlow,
  },
  modelRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  modelRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  modelInfo: { flex: 1 },
  modelLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  modelDataset: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  accuracyBadge: {
    backgroundColor: COLORS.primaryGlow,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  accuracyText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.primaryLight,
    fontSize: 11,
  },

  // Info card
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  infoTitle: { ...TYPOGRAPHY.labelLarge, color: COLORS.textSecondary },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  infoDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.secondary,
    flexShrink: 0,
  },
  infoText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
