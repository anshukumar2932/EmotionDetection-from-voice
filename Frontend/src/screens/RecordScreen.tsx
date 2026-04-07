// src/screens/RecordScreen.tsx
// Full audio recording screen with timer, waveform, and emotion analysis

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import BackButton from '../components/BackButton';
import WaveformAnimation from '../components/WaveformAnimation';
import GradientButton from '../components/GradientButton';
import Toast, { ToastRef } from '../components/Toast';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { RootStackParamList } from '../types/navigation';
import { analyzeAudioEmotion } from '../services/emotionApi';
import { addHistoryItem } from '../services/historyService';
import { EmotionType } from '../types/emotion';

type Nav = StackNavigationProp<RootStackParamList>;

/** Format seconds into MM:SS display string */
function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function RecordScreen() {
  const navigation = useNavigation<Nav>();
  const toastRef = useRef<ToastRef>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0); // saved duration after stop
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation>();
  const ringAnim = useRef(new Animated.Value(1)).current;
  const ringLoop = useRef<Animated.CompositeAnimation>();
  const resultAnim = useRef(new Animated.Value(0)).current;

  // Request microphone permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      if (!granted) {
        toastRef.current?.show('Microphone permission denied', 'error');
      }
    })();

    // Cleanup on unmount
    return () => {
      stopTimer();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  // ─── Pulse animation helpers ─────────────────────────────────
  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 550, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();

    // Expanding ring
    ringLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1.6, duration: 1000, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
      ])
    );
    ringLoop.current.start();
  };

  const stopPulse = () => {
    pulseLoop.current?.stop();
    ringLoop.current?.stop();
    Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    Animated.spring(ringAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  // ─── Timer helpers ────────────────────────────────────────────
  const startTimer = () => {
    setRecordingDuration(0);
    timerRef.current = setInterval(() => {
      setRecordingDuration((d) => d + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ─── Start Recording ──────────────────────────────────────────
  const startRecording = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please grant microphone access in your device Settings to record audio.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordedUri(null);
      startTimer();
      startPulse();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      toastRef.current?.show('Recording started', 'success', 1500);
    } catch (err) {
      console.error('Failed to start recording:', err);
      toastRef.current?.show('Failed to start recording', 'error');
    }
  };

  // ─── Stop Recording ───────────────────────────────────────────
  const stopRecording = async () => {
    if (!recordingRef.current) return;
    try {
      const duration = recordingDuration;
      stopTimer();
      stopPulse();

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      // Reset audio mode for playback
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      setIsRecording(false);
      setRecordedDuration(duration);

      if (uri) {
        setRecordedUri(uri);
        // Animate result card in
        resultAnim.setValue(0);
        Animated.spring(resultAnim, {
          toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8,
        }).start();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toastRef.current?.show('Recording saved!', 'success');
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      toastRef.current?.show('Failed to stop recording', 'error');
      setIsRecording(false);
    }
  };

  // ─── Discard & Re-record ──────────────────────────────────────
  const discardRecording = () => {
    Alert.alert('Discard Recording', 'Are you sure you want to discard this recording?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setRecordedUri(null);
          setRecordingDuration(0);
          setRecordedDuration(0);
          resultAnim.setValue(0);
        },
      },
    ]);
  };

  // ─── Analyze ─────────────────────────────────────────────────
  const analyzeRecording = async () => {
    if (!recordedUri) return;
    setIsAnalyzing(true);
    try {
      const fileName = `recording_${Date.now()}.m4a`;

      const result = await analyzeAudioEmotion(recordedUri, fileName, 'audio/m4a');

      if (result.success && result.result) {
        const { emotion, confidence } = result.result;
        const ts = new Date().toISOString();

        await addHistoryItem({
          id: Date.now().toString(),
          audioName: fileName,
          emotion: emotion as EmotionType,
          confidence,
          timestamp: ts,
        });

        navigation.navigate('Result', {
          emotion,
          confidence,
          audioName: fileName,
          timestamp: ts,
        });
      } else {
        toastRef.current?.show(result.error ?? 'Analysis failed. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      toastRef.current?.show('An unexpected error occurred', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Record Audio</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Timer display */}
          <View style={styles.timerSection}>
            <Text style={styles.timer}>{formatTime(recordingDuration)}</Text>
            {isRecording && (
              <View style={styles.liveRow}>
                <Animated.View
                  style={[
                    styles.liveDot,
                    {
                      transform: [{ scale: pulseAnim }],
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.08],
                        outputRange: [1, 0.6],
                      }),
                    },
                  ]}
                />
                <Text style={styles.liveText}>RECORDING</Text>
              </View>
            )}
            {!isRecording && recordingDuration === 0 && (
              <Text style={styles.timerHint}>Tap the button below to start</Text>
            )}
          </View>

          {/* Waveform visualizer */}
          <View style={styles.waveformCard}>
            <WaveformAnimation
              isActive={isRecording}
              color={isRecording ? COLORS.recordActive : COLORS.primary}
              height={80}
              barCount={40}
            />
            {!isRecording && recordingDuration === 0 && (
              <Text style={styles.waveformPlaceholder}>Waveform will appear here</Text>
            )}
          </View>

          {/* Main record button */}
          <View style={styles.recordArea}>
            {/* Expanding ring (visible only while recording) */}
            {isRecording && (
              <Animated.View
                style={[
                  styles.ring,
                  {
                    transform: [{ scale: ringAnim }],
                    opacity: ringAnim.interpolate({
                      inputRange: [1, 1.6],
                      outputRange: [0.5, 0],
                    }),
                  },
                ]}
              />
            )}

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                activeOpacity={0.85}
                style={[
                  styles.recordOuter,
                  { borderColor: isRecording ? COLORS.recordActive : COLORS.border },
                ]}
              >
                <LinearGradient
                  colors={
                    isRecording
                      ? [COLORS.recordActive, '#8B0000']
                      : [COLORS.primary, COLORS.primaryDark]
                  }
                  style={styles.recordInner}
                >
                  <Ionicons
                    name={isRecording ? 'stop' : 'mic'}
                    size={40}
                    color={COLORS.white}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.recordHint}>
              {isRecording
                ? 'Tap to stop'
                : recordedUri
                ? 'Tap to re-record'
                : 'Tap to begin recording'}
            </Text>
          </View>

          {/* Recorded result card — shown after successful recording */}
          {recordedUri && !isRecording && (
            <Animated.View
              style={[
                styles.resultCard,
                {
                  opacity: resultAnim,
                  transform: [{
                    translateY: resultAnim.interpolate({
                      inputRange: [0, 1], outputRange: [24, 0],
                    }),
                  }],
                },
              ]}
            >
              {/* Recording info */}
              <View style={styles.resultInfo}>
                <View style={styles.resultIcon}>
                  <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
                </View>
                <View style={styles.resultMeta}>
                  <Text style={styles.resultTitle}>Recording Ready</Text>
                  <Text style={styles.resultDuration}>
                    Duration: {formatTime(recordedDuration)}
                  </Text>
                </View>
                <TouchableOpacity onPress={discardRecording} style={styles.discardBtn}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>

              {/* Analyze button */}
              <GradientButton
                title="Analyze Emotion"
                onPress={analyzeRecording}
                loading={isAnalyzing}
                gradientColors={[COLORS.primary, COLORS.secondary]}
                icon={<Ionicons name="analytics" size={20} color={COLORS.white} />}
              />
            </Animated.View>
          )}

          {/* Permission denied state */}
          {hasPermission === false && (
            <View style={styles.permError}>
              <Ionicons name="mic-off-outline" size={48} color={COLORS.error} />
              <Text style={styles.permTitle}>Microphone Access Required</Text>
              <Text style={styles.permSubtitle}>
                Please enable microphone access in your device Settings to use this feature.
              </Text>
            </View>
          )}

          {/* Tips */}
          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Tips for better results</Text>
            {[
              'Speak clearly and at normal volume',
              'Record at least 3–5 seconds of audio',
              'Minimize background noise',
              'Hold device 15–30cm from mouth',
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Toast notifications */}
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

  // Timer
  timerSection: { alignItems: 'center', paddingVertical: SPACING.lg },
  timer: {
    fontSize: 68,
    fontWeight: '200',
    color: COLORS.textPrimary,
    letterSpacing: 6,
    fontVariant: ['tabular-nums'],
    lineHeight: 78,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.recordActive,
  },
  liveText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.recordActive,
    letterSpacing: 2,
  },
  timerHint: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },

  // Waveform
  waveformCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformPlaceholder: {
    position: 'absolute',
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
  },

  // Record button area
  recordArea: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.lg,
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: COLORS.recordActive,
    top: '50%',
    marginTop: -65 + SPACING.lg,
  },
  recordOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  recordInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordHint: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },

  // Result card
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0,229,160,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultMeta: { flex: 1 },
  resultTitle: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.success,
    fontWeight: '700',
  },
  resultDuration: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  discardBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,77,109,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Permission error
  permError: {
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: `${COLORS.error}33`,
  },
  permTitle: {
    ...TYPOGRAPHY.headingMedium,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  permSubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Tips
  tips: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  tipsTitle: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  tipText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});