// src/constants/emotionConfig.ts
// Maps each emotion to its display properties

import { EmotionType } from '../types/emotion';
import { COLORS } from '../theme/colors';

export interface EmotionConfig {
  label: string;
  emoji: string;
  color: string;
  glow: string;
  description: string;
  iconName: string; // Ionicons name
}

export const EMOTION_CONFIG: Record<EmotionType, EmotionConfig> = {
  happy: {
    label: 'Happy',
    emoji: '😊',
    color: COLORS.happy,
    glow: COLORS.happyGlow,
    description: 'The audio conveys joy and positivity.',
    iconName: 'sunny',
  },
  sad: {
    label: 'Sad',
    emoji: '😢',
    color: COLORS.sad,
    glow: COLORS.sadGlow,
    description: 'The audio conveys sorrow or melancholy.',
    iconName: 'rainy',
  },
  angry: {
    label: 'Angry',
    emoji: '😠',
    color: COLORS.angry,
    glow: COLORS.angryGlow,
    description: 'The audio conveys frustration or anger.',
    iconName: 'flame',
  },
  neutral: {
    label: 'Neutral',
    emoji: '😐',
    color: COLORS.neutral,
    glow: COLORS.neutralGlow,
    description: 'The audio has no strong emotional tone.',
    iconName: 'remove-circle',
  },
  fearful: {
    label: 'Fearful',
    emoji: '😨',
    color: COLORS.fearful,
    glow: COLORS.fearfulGlow,
    description: 'The audio conveys fear or anxiety.',
    iconName: 'alert-circle',
  },
  disgusted: {
    label: 'Disgusted',
    emoji: '🤢',
    color: COLORS.disgusted,
    glow: COLORS.disgustedGlow,
    description: 'The audio conveys disgust or aversion.',
    iconName: 'skull',
  },
  surprised: {
    label: 'Surprised',
    emoji: '😲',
    color: COLORS.surprised,
    glow: COLORS.surprisedGlow,
    description: 'The audio conveys surprise or astonishment.',
    iconName: 'flash',
  },
};

// Supported audio formats
export const SUPPORTED_AUDIO_FORMATS = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'audio/flac',
];

export const SUPPORTED_EXTENSIONS = ['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac'];