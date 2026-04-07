// src/types/navigation.ts
// Defines all route params for type-safe navigation

export type RootStackParamList = {
  Home: undefined;
  Record: undefined;
  Upload: undefined;
  Result: {
    emotion: string;
    confidence: number;
    audioName: string;
    timestamp: string;
    actualEmotion?: string;
    isCorrect?: boolean;
  };
  History: undefined;
};