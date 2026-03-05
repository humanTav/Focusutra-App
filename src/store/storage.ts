import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChecklistItem, Stats } from '../types';

// --- KEYS & DEFAULTS ---
const KEYS = {
  TOTAL_MINUTES: 'focusutra_total_minutes',
  SESSIONS: 'focusutra_sessions',
  HISTORY: 'focusutra_history_log',
  START_DATE: 'focusutra_start_date',

  CHECKLIST_ITEMS: 'focusutra_checklist_items_v1',
  CHECKLIST_ENABLED: 'focusutra_checklist_enabled_v1',

  BREATHING_METHOD: 'focusutra_breathing_method_v1',
  BREATHING_ENABLED: 'focusutra_breathing_enabled_v1',

  TIMEOUT_ACTIVITIES: 'focusutra_timeout_activities_v1',
  TIMEOUT_ENABLED: 'focusutra_timeout_enabled_v1',

  FOCUS_SOUND: 'focusutra_focus_sound_v1',
  FOCUS_SOUND_ENABLED: 'focus_sound_enabled',
};

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: '1', text: 'Hydration (Großes Glas Wasser)', selected: true },
  { id: '2', text: 'Raumtemperatur (20°C - 24°C)', selected: true },
  { id: '3', text: 'Nootropischer Push (L-Theanin & Koffein)', selected: false },
  { id: '4', text: 'Smartphone Flugmodus', selected: true },
];

export const DEFAULT_TIMEOUT_ACTIVITIES: ChecklistItem[] = [
  { id: '1', text: 'Panoramic Vision (Horizont anstarren)', selected: true },
  { id: '2', text: 'NSDR (Non-Sleep Deep Rest)', selected: true },
  { id: '3', text: 'Move / Shake', selected: true },
  { id: '4', text: 'Hydrate (Wasser)', selected: true },
];

// --- HELPER FUNCTIONS ---

/**
 * Liest Daten generisch mit sauberem Fallback.
 */
async function getData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);

    if (value === null) {
      return defaultValue;
    }

    // JSON try/catch für sauberes Fallback bei kaputten Daten
    try {
      return JSON.parse(value);
    } catch {
      console.warn(`[Storage] Corrupt data or legacy string for ${key}, using default.`);
      return defaultValue;
    }
  } catch (e) {
    console.warn(`[Storage] System Error loading ${key}`, e);
    return defaultValue;
  }
}

// Speichert Daten generisch
async function setData<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[Storage] Error saving ${key}`, e);
  }
}

export const getDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatMinutesToHours = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

// ==========================================
//              FEATURE GETTERS
// ==========================================

// --- CHECKLISTE ---
export const getChecklistItems = () => getData<ChecklistItem[]>(KEYS.CHECKLIST_ITEMS, DEFAULT_CHECKLIST);
export const saveChecklistItems = (items: ChecklistItem[]) => setData(KEYS.CHECKLIST_ITEMS, items);

export const getChecklistEnabled = () => getData<boolean>(KEYS.CHECKLIST_ENABLED, true);
export const saveChecklistEnabled = (enabled: boolean) => setData(KEYS.CHECKLIST_ENABLED, enabled);

// --- ATEM ÜBUNG ---
export const getBreathingMethod = () => getData<string>(KEYS.BREATHING_METHOD, 'box_breathing');
export const saveBreathingMethod = (method: string) => setData(KEYS.BREATHING_METHOD, method);

export const getBreathingEnabled = () => getData<boolean>(KEYS.BREATHING_ENABLED, true);
export const saveBreathingEnabled = (enabled: boolean) => setData(KEYS.BREATHING_ENABLED, enabled);

// --- TIMEOUT ---
export const getTimeoutActivities = () => getData<ChecklistItem[]>(KEYS.TIMEOUT_ACTIVITIES, DEFAULT_TIMEOUT_ACTIVITIES);
export const saveTimeoutActivities = (items: ChecklistItem[]) => setData(KEYS.TIMEOUT_ACTIVITIES, items);

export const getTimeoutEnabled = () => getData<boolean>(KEYS.TIMEOUT_ENABLED, true);
export const saveTimeoutEnabled = (enabled: boolean) => setData(KEYS.TIMEOUT_ENABLED, enabled);

// --- FOCUS SOUND ---
export const getFocusSound = () => getData<string>(KEYS.FOCUS_SOUND, 'silent');
export const saveFocusSound = (soundId: string) => setData(KEYS.FOCUS_SOUND, soundId);

export const getFocusSoundEnabled = () => getData<boolean>(KEYS.FOCUS_SOUND_ENABLED, true);
export const saveFocusSoundEnabled = (enabled: boolean) => setData(KEYS.FOCUS_SOUND_ENABLED, enabled);


// ==========================================
//              STATS & SESSION (Optimized)
// ==========================================

export const getStats = async (): Promise<Stats> => {
  try {
    // Parallel laden für Speed
    const [total, sessions] = await Promise.all([
      AsyncStorage.getItem(KEYS.TOTAL_MINUTES),
      AsyncStorage.getItem(KEYS.SESSIONS)
    ]);
    return {
      totalMinutes: total ? parseInt(total, 10) : 0,
      sessions: sessions ? parseInt(sessions, 10) : 0,
    };
  } catch (e) {
    return { totalMinutes: 0, sessions: 0 };
  }
};

export const getHistory = async (): Promise<Record<string, number>> => {
  return getData<Record<string, number>>(KEYS.HISTORY, {});
};

export const getStartDate = async () => {
  try { return await AsyncStorage.getItem(KEYS.START_DATE); } catch { return null; }
};

/**
 * SENIOR OPTIMIZATION:
 * Diese Funktion führt jetzt alle Lese-Operationen parallel aus 
 * und alle Schreib-Operationen in einem einzigen Batch (multiSet).
 */
export const saveSession = async (minutes: number): Promise<Stats> => {
  const today = getDateKey(new Date());

  // 1. Parallel alles laden, was wir brauchen
  const [currentStats, history, startDate] = await Promise.all([
    getStats(),
    getHistory(),
    AsyncStorage.getItem(KEYS.START_DATE)
  ]);

  // 2. Werte berechnen
  const newTotal = currentStats.totalMinutes + minutes;
  const newSessions = currentStats.sessions + 1;
  const currentDayMinutes = history[today] ?? 0;

  // History updaten
  history[today] = currentDayMinutes + minutes;

  // 3. Batch Write: Alles auf einmal speichern
  const saveOperations: [string, string][] = [
    [KEYS.TOTAL_MINUTES, newTotal.toString()],
    [KEYS.SESSIONS, newSessions.toString()],
    [KEYS.HISTORY, JSON.stringify(history)],
  ];

  if (!startDate) {
    saveOperations.push([KEYS.START_DATE, today]);
  }

  await AsyncStorage.multiSet(saveOperations);

  return { totalMinutes: newTotal, sessions: newSessions };
};
// --- SESSION INTENTION & BRAIN DUMP ---
export const saveSessionIntention = async (goal: string, brainDump: string) => {
  try {
    const data = JSON.stringify({ goal, brainDump });
    await AsyncStorage.setItem('current_session_intention', data);
  } catch (e) {
    console.error("Failed to save intention", e);
  }
};

export const getSessionIntention = async () => {
  try {
    const data = await AsyncStorage.getItem('current_session_intention');
    return data ? JSON.parse(data) : { goal: '', brainDump: '' };
  } catch (e) {
    console.error("Failed to get intention", e);
    return { goal: '', brainDump: '' };
  }
};