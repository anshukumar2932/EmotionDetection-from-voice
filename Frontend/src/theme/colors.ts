// src/theme/colors.ts
// Centralized color palette — dark, deep-space aesthetic with neon accents

export const COLORS = {
  // Base
  background: '#0A0A15',
  surface: '#12121F',
  surfaceElevated: '#1A1A2E',
  card: '#16162A',
  border: '#2A2A45',

  // Primary accent — electric violet
  primary: '#7C5CFC',
  primaryLight: '#9B7EFF',
  primaryDark: '#5A3FD6',
  primaryGlow: 'rgba(124, 92, 252, 0.3)',

  // Secondary accent — cyan
  secondary: '#00D4FF',
  secondaryGlow: 'rgba(0, 212, 255, 0.25)',

  // Text
  textPrimary: '#F0EFFF',
  textSecondary: '#8888AA',
  textMuted: '#4A4A6A',

  // Emotion colors
  happy: '#FFD60A',
  happyGlow: 'rgba(255, 214, 10, 0.3)',
  sad: '#4FC3F7',
  sadGlow: 'rgba(79, 195, 247, 0.3)',
  angry: '#FF4D4D',
  angryGlow: 'rgba(255, 77, 77, 0.3)',
  neutral: '#90A4AE',
  neutralGlow: 'rgba(144, 164, 174, 0.3)',
  fearful: '#CE93D8',
  fearfulGlow: 'rgba(206, 147, 216, 0.3)',
  disgusted: '#A5D6A7',
  disgustedGlow: 'rgba(165, 214, 167, 0.3)',
  surprised: '#FFAB40',
  surprisedGlow: 'rgba(255, 171, 64, 0.3)',

  // Status
  success: '#00E5A0',
  error: '#FF4D6D',
  warning: '#FFB800',

  // Recording
  recordActive: '#FF4D6D',
  recordGlow: 'rgba(255, 77, 109, 0.4)',

  // White
  white: '#FFFFFF',
  black: '#000000',
};

export type ColorKey = keyof typeof COLORS;