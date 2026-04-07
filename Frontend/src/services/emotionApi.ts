// src/services/emotionApi.ts
// Handles all API communication for emotion detection

import axios, { AxiosError } from 'axios';
import { ApiResponse, EmotionType } from '../types/emotion';
import { API_BASE_URL, API_TIMEOUT } from '../config';

const ANALYZE_ENDPOINT = `${API_BASE_URL}/predict-emotion`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: 'application/json',
  },
});

// ─── Main API Call ────────────────────────────────────────────────

/**
 * Sends an audio file to the backend for emotion analysis.
 * Uses multipart/form-data encoding.
 *
 * @param fileUri - Local URI of the audio file
 * @param fileName - Display name of the file
 * @param mimeType - MIME type (e.g., 'audio/wav')
 */
export async function analyzeAudioEmotion(
  fileUri: string,
  fileName: string,
  mimeType: string = 'audio/wav',
  model: string = 'anshu_cnn_lstm_attention'
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('audio', { uri: fileUri, name: fileName, type: mimeType } as any);
    formData.append('model', model);

    const response = await apiClient.post(ANALYZE_ENDPOINT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const data = response.data;
    if (!data || typeof data.predicted_emotion !== 'string') {
      throw new Error('Invalid response format from server.');
    }

    return {
      success: true,
      result: {
        emotion: data.predicted_emotion.toLowerCase() as EmotionType,
        confidence: data.confidence ?? 1.0,
      },
    };
  } catch (err) {
    return handleApiError(err);
  }
}

// ─── Error Handler ────────────────────────────────────────────────

function handleApiError(err: unknown): ApiResponse {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ detail?: string; message?: string }>;

    if (!axiosErr.response) {
      return {
        success: false,
        error: 'Cannot reach server. Check your connection or backend URL.',
      };
    }

    const status = axiosErr.response.status;
    const serverMsg = axiosErr.response.data?.detail ?? axiosErr.response.data?.message;

    if (status === 400) {
      return { success: false, error: serverMsg ?? 'Invalid audio format or missing file.' };
    }
    if (status === 404) {
      return { success: false, error: serverMsg ?? 'No dataset samples found for this model.' };
    }
    if (status === 413) {
      return { success: false, error: 'File too large. Please upload a smaller audio file.' };
    }
    if (status === 422) {
      return { success: false, error: serverMsg ?? 'Audio could not be processed. Try a different file.' };
    }
    if (status === 503) {
      return { success: false, error: serverMsg ?? 'Model not available on server.' };
    }
    if (status >= 500) {
      return { success: false, error: serverMsg ?? 'Server error. Please try again later.' };
    }

    return { success: false, error: serverMsg ?? `Request failed with status ${status}.` };
  }

  if (err instanceof Error) {
    return { success: false, error: err.message };
  }

  return { success: false, error: 'An unexpected error occurred.' };
}

// ─── Random Sample ───────────────────────────────────────────────

/**
 * Asks the backend to pick a random dataset sample and run inference.
 * No file upload needed — just sends the model name as form data.
 */
export async function analyzeRandomSample(model: string = 'anshu_cnn_lstm_attention'): Promise<ApiResponse & { audioName?: string; actualEmotion?: string; isCorrect?: boolean }> {
  try {
    const formData = new FormData();
    formData.append('model', model);

    const response = await apiClient.post(ANALYZE_ENDPOINT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const data = response.data;
    if (!data || typeof data.predicted_emotion !== 'string') {
      throw new Error('Invalid response format from server.');
    }

    return {
      success: true,
      audioName: data.audio_filename ?? 'random_sample.wav',
      actualEmotion: data.actual_emotion ?? undefined,
      isCorrect: data.is_correct ?? undefined,
      result: {
        emotion: data.predicted_emotion.toLowerCase() as EmotionType,
        confidence: data.confidence ?? 1.0,
      },
    };
  } catch (err) {
    return handleApiError(err);
  }
}

// ─── Mock (for testing without backend) ──────────────────────────

/**
 * Returns a mock emotion result for UI testing.
 * Remove this in production.
 */
export async function mockAnalyzeAudio(fileName: string): Promise<ApiResponse> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 2500));

  const emotions: EmotionType[] = [
    'happy', 'sad', 'angry', 'neutral', 'fearful', 'disgusted', 'surprised',
  ];
  const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
  const randomConfidence = 0.65 + Math.random() * 0.3; // 65–95%

  // Build mock all_scores
  const remaining = 1 - randomConfidence;
  const otherEmotions = emotions.filter((e) => e !== randomEmotion);
  const allScores: Record<string, number> = { [randomEmotion]: randomConfidence };
  let leftover = remaining;
  otherEmotions.forEach((e, i) => {
    const val = i === otherEmotions.length - 1 ? leftover : Math.random() * leftover * 0.6;
    allScores[e] = parseFloat(val.toFixed(3));
    leftover -= val;
  });

  return {
    success: true,
    result: {
      emotion: randomEmotion,
      confidence: parseFloat(randomConfidence.toFixed(3)),
      allScores: allScores as any,
    },
  };
}