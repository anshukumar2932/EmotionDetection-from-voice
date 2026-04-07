// src/types/emotion.ts

export type EmotionType =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'neutral'
  | 'fearful'
  | 'disgusted'
  | 'surprised';

export interface EmotionResult {
  emotion: EmotionType;
  confidence: number;
  allScores?: Record<EmotionType, number>;
}

export interface HistoryItem {
  id: string;
  audioName: string;
  emotion: EmotionType;
  confidence: number;
  timestamp: string;
}

export interface ApiResponse {
  success: boolean;
  result?: EmotionResult;
  error?: string;
}