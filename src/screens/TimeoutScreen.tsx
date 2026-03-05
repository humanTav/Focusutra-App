import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, AppState, Vibration } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { getTimeoutActivities, DEFAULT_TIMEOUT_ACTIVITIES, clearSessionIntention } from '../store/storage';

type ScreenMode = 'selection' | 'time_select' | 'active_reset' | 'nsdr' | 'completed';

export default function TimeoutScreen({ route, navigation }: any) {
  useKeepAwake();

  const minutes = route?.params?.minutes ?? 0;

  const [mode, setMode] = useState<ScreenMode>('selection');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [currentActivity, setCurrentActivity] = useState({ text: 'Panoramic Vision (Fensterblick)' });
  const [showTips, setShowTips] = useState(true);

  const endTimeRef = useRef<number | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // --- 1. LOAD RANDOM ACTIVITY ---
  useEffect(() => {
    const load = async () => {
      const allItems = await getTimeoutActivities();
      const activeItems = allItems.filter((i: any) => i.selected);
      const pool = activeItems.length > 0 ? activeItems : DEFAULT_TIMEOUT_ACTIVITIES;
      setCurrentActivity(pool[Math.floor(Math.random() * pool.length)]);
    };
    load();
  }, []);

  // --- 2. BACKGROUND LOGIC (Timestamp-Trick) ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        if (endTimeRef.current && (mode === 'active_reset' || mode === 'nsdr')) {
          const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
          if (remaining <= 0) {
            setSecondsLeft(0);
            handleBreakFinished();
          } else {
            setSecondsLeft(remaining);
          }
        }
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, [mode]);

  // --- 3. ACTIVE TIMER COUNTDOWN ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if ((mode === 'active_reset' || mode === 'nsdr') && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleBreakFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, secondsLeft]);

  // --- 4. TIPS FADE ---
  useEffect(() => {
    if (mode === 'active_reset') {
      setShowTips(true);
      const t = setTimeout(() => setShowTips(false), 8000);
      return () => clearTimeout(t);
    }
  }, [mode]);

  // --- HANDLERS ---
  const startTimer = (mins: number, type: 'active_reset' | 'nsdr') => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    endTimeRef.current = Date.now() + mins * 60 * 1000;
    setSecondsLeft(mins * 60);
    setMode(type);
  };

  // Fix #2: no flashWhite — just trigger haptics/vibration and switch mode to black screen immediately
  const handleBreakFinished = () => {
    endTimeRef.current = null;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Vibration.vibrate([0, 500, 200, 500]);
    setMode('completed');
  };

  // Fix #5: clear brain dump before navigating away
  const finishSession = async () => {
    await clearSessionIntention();
    navigation.replace('Final', { minutes });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- RENDER: SELECTION ---
  if (mode === 'selection') {
    return (
      <View className="flex-1 bg-black px-6 pt-24 pb-12 justify-between">
        <View className="w-full">
          <Text className="text-gray-500 text-xs font-bold tracking-[2px] uppercase mb-1">Session Complete</Text>
          <Text className="text-white text-4xl font-bold tracking-tighter mb-6">The Pit Stop</Text>

          <View className="bg-blue-900/20 border border-blue-900 p-4 rounded-2xl mb-8 w-full">
            <Text className="text-blue-300 text-sm leading-6 font-medium">
              Vermeide neuen Input (Social Media). Dein Gehirn festigt jetzt die neuroplastischen Verbindungen.
            </Text>
          </View>

          <TouchableOpacity onPress={() => startTimer(20, 'nsdr')} activeOpacity={0.8} className="w-full bg-[#111] border border-gray-800 p-6 rounded-[32px] mb-4">
            <View className="flex-row justify-between items-center mb-2 w-full">
              <View className="flex-row items-center">
                <Ionicons name="moon" size={18} color="#818cf8" style={{ marginRight: 8 }} />
                <Text className="text-white text-xl font-bold">NSDR Protocol</Text>
              </View>
              <View className="bg-gray-800 px-3 py-1 rounded-full">
                <Text className="text-gray-300 text-xs font-bold">20 Min</Text>
              </View>
            </View>
            <Text className="text-gray-500 text-sm">Geführte Tiefenentspannung. Lädt synaptische Reserven auf.</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode('time_select')} activeOpacity={0.8} className="w-full bg-[#111] border border-gray-800 p-6 rounded-[32px]">
            <View className="flex-row items-center mb-2">
              <Ionicons name="walk" size={18} color="#34d399" style={{ marginRight: 8 }} />
              <Text className="text-white text-xl font-bold">Active Reset</Text>
            </View>
            <Text className="text-gray-500 text-sm mb-3">Bewegung & freier Timer.</Text>
            <View className="bg-gray-900 p-3 rounded-xl border border-gray-800">
              <Text className="text-emerald-400 text-xs font-bold uppercase tracking-widest">
                Deine Aktivität: {currentActivity.text}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={finishSession} className="w-full py-4 items-center mt-4">
          <Text className="text-gray-600 font-bold tracking-[2px] text-xs uppercase">End Session (Shutdown)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- RENDER: TIME SELECT ---
  if (mode === 'time_select') {
    return (
      <View className="flex-1 bg-black px-6 pt-32 pb-12 items-center justify-between">
        <View className="w-full items-center">
          <Text className="text-gray-500 text-xs font-bold tracking-[2px] uppercase mb-4">Active Reset</Text>
          <Text className="text-white text-2xl font-bold mb-12">Wie lange brauchst du?</Text>

          <View className="w-full gap-y-4">
            {[5, 10, 20].map((mins) => (
              <TouchableOpacity
                key={mins}
                onPress={() => startTimer(mins, 'active_reset')}
                className="w-full border border-gray-800 bg-[#111] py-5 rounded-[24px] items-center active:bg-[#222]"
              >
                <Text className="text-white text-lg font-bold">{mins} Minuten</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={() => setMode('selection')} className="w-full py-4 items-center">
          <Text className="text-gray-500 font-bold text-xs tracking-widest uppercase">Zurück</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- RENDER: ACTIVE TIMER ---
  if (mode === 'active_reset' || mode === 'nsdr') {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        {mode === 'active_reset' && showTips && (
          <View className="absolute top-32 w-full items-center">
            <Text className="text-gray-400 font-medium text-center text-sm mb-2">Lass das Handy liegen.</Text>
            <Text className="text-gray-500 text-xs text-center font-bold uppercase tracking-widest">
              {currentActivity.text}
            </Text>
          </View>
        )}

        <Text style={{ color: '#1a1a1a', fontSize: 100, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {formatTime(secondsLeft)}
        </Text>

        <TouchableOpacity
          onPress={handleBreakFinished}
          className="absolute bottom-12 px-6 py-4 w-full items-center"
        >
          <Text className="text-[#333333] font-bold text-xs uppercase tracking-widest">Skip Break</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- RENDER: COMPLETED (Fix #2 + #3 + #4) ---
  // Always black, flat/full-screen, no card, no flashWhite, only 2 buttons
  return (
    <View className="flex-1 bg-black px-6 justify-center items-center">
      <View className="bg-green-500/20 p-6 rounded-full mb-8">
        <Ionicons name="battery-charging" size={48} color="#22c55e" />
      </View>

      <Text className="text-white text-3xl font-extrabold uppercase tracking-widest mb-2">Recharged</Text>
      <Text className="text-gray-400 text-xs text-center mb-12 font-medium leading-5">
        Deine synaptischen Reserven sind aufgeladen. Bereit für den nächsten Schritt?
      </Text>

      <View className="w-full gap-y-3">
        <TouchableOpacity
          onPress={() => navigation.replace('Focus')}
          className="w-full py-4 rounded-2xl items-center border-[1px] bg-white border-white shadow-lg shadow-white/20"
        >
          <Text className="font-bold tracking-widest text-sm uppercase text-black">Nächster Block</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={finishSession} className="py-4 items-center w-full">
          <Text className="text-gray-600 font-bold tracking-[2px] text-xs uppercase">Feierabend</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
