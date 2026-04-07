// src/services/historyService.ts
// Manages local history of analyzed audio files using AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryItem } from '../types/emotion';

const HISTORY_KEY = '@emotion_detector_history';
const MAX_HISTORY = 50; // keep last 50 entries

/**
 * Fetches all history items from local storage.
 */
export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    if (!json) return [];
    return JSON.parse(json) as HistoryItem[];
  } catch {
    return [];
  }
}

/**
 * Prepends a new item to history, trimming to MAX_HISTORY.
 */
export async function addHistoryItem(item: HistoryItem): Promise<void> {
  try {
    const existing = await getHistory();
    const updated = [item, ...existing].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save history item:', err);
  }
}

/**
 * Removes a single history item by ID.
 */
export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    const existing = await getHistory();
    const updated = existing.filter((item) => item.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete history item:', err);
  }
}

/**
 * Clears all history.
 */
export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.warn('Failed to clear history:', err);
  }
}