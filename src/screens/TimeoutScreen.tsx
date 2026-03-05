import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { getTimeoutActivities, DEFAULT_TIMEOUT_ACTIVITIES } from '../store/storage';

type ScreenMode = 'selection' | 'quick' | 'nsdr' | 'done';

export default function TimeoutScreen({ route, navigation }: any) {
  useKeepAwake();

  const minutes = route?.params?.minutes ?? 0;

  const [mode, setMode] = useState<ScreenMode>('selection');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isFaceDown, setIsFaceDown] = useState(false);
  const [currentActivity, setCurrentActivity] = useState({ text: 'Panoramic Vision (Fensterblick)' });

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

  // --- 2. SENSOR (quick mode only) ---
  useEffect(() => {
    if (mode !== 'quick') return;
    Accelerometer.setUpdateInterval(200);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      setIsFaceDown(z > 0.9 && Math.abs(x) < 0.2 && Math.abs(y) < 0.2);
    });
    return () => subscription.remove();
  }, [mode]);

  // --- 3. TIMER ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const shouldRun = mode === 'quick' && isFaceDown;
    if (shouldRun && secondsLeft > 0) {
      interval = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    } else if (secondsLeft === 0 && mode === 'quick') {
      handleBreakFinished();
    }
    return () => clearInterval(interval);
  }, [mode, isFaceDown, secondsLeft]);

  // --- HANDLERS ---
  const startQuickBreak = () => { setSecondsLeft(5 * 60); setMode('quick'); };
  const startNSDR = () => { setSecondsLeft(20 * 60); setMode('nsdr'); };

  const handleBreakFinished = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMode('done');
  };

  const finishSession = () => {
    navigation.replace('Final', { minutes });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- SELECTION MODE ---
  if (mode === 'selection') {
    return (
      <View className="flex-1 bg-black px-6 pt-24 pb-12 justify-between">
        <View>
          <Text className="text-gray-500 text-xs font-bold tracking-[2px] uppercase mb-1">Recovery</Text>
          <Text className="text-white text-4xl font-bold tracking-tighter mb-6">The Pit Stop</Text>
          <Text className="text-gray-400 text-base mb-10 leading-6">
            Dein Gehirn braucht jetzt Zeit, um neuroplastische Verbindungen zu festigen. Wähle deine Erholung.
          </Text>

          {/* NSDR */}
          <TouchableOpacity onPress={startNSDR} activeOpacity={0.8} className="bg-[#111] border border-gray-800 p-6 rounded-3xl mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white text-xl font-bold">NSDR Protocol</Text>
              <View className="bg-gray-800 px-3 py-1 rounded-full">
                <Text className="text-gray-300 text-xs font-bold">20 Min</Text>
              </View>
            </View>
            <Text className="text-gray-500 text-sm">Geführte Tiefenentspannung. Reduziert Stress sofort.</Text>
          </TouchableOpacity>

          {/* Quick Break */}
          <TouchableOpacity onPress={startQuickBreak} activeOpacity={0.8} className="bg-[#111] border border-gray-800 p-6 rounded-3xl">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white text-xl font-bold">Quick Disconnect</Text>
              <View className="bg-gray-800 px-3 py-1 rounded-full">
                <Text className="text-gray-300 text-xs font-bold">5 Min</Text>
              </View>
            </View>
            <Text className="text-gray-500 text-sm mb-3">Offline gehen & Gerät umdrehen.</Text>
            <Text className="text-blue-400 text-xs font-bold uppercase tracking-widest">
              Tipp: {currentActivity.text}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={finishSession}
          className="border border-gray-800 py-5 rounded-2xl items-center"
        >
          <Text className="text-gray-500 font-bold tracking-widest text-sm">FEIERABEND</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- ACTIVE BREAK (quick or nsdr) ---
  if (mode === 'quick' || mode === 'nsdr') {
    const timerActive = mode === 'quick' && isFaceDown;
    return (
      <View className="flex-1 bg-black justify-center items-center px-6">
        <Text className="text-gray-500 text-xs font-bold tracking-[4px] uppercase mb-8">
          {mode === 'nsdr' ? 'NSDR Protocol' : 'Digital Detox'}
        </Text>

        <Text className={`text-8xl font-bold font-mono my-8 ${timerActive || mode === 'nsdr' ? 'text-white' : 'text-gray-600'}`}>
          {formatTime(secondsLeft)}
        </Text>

        <View className="h-32 justify-center w-full items-center">
          {mode === 'quick' ? (
            !isFaceDown ? (
              <View className="bg-red-900/20 px-6 py-4 rounded-2xl border border-red-500 w-full">
                <Text className="text-red-500 text-xl font-extrabold text-center uppercase tracking-widest">Keine Handyzeit!</Text>
                <Text className="text-red-400 text-xs text-center mt-1">Gerät flach auf den Tisch legen.</Text>
              </View>
            ) : (
              <Text className="text-blue-400 text-sm font-bold tracking-widest uppercase text-center">
                Erholung läuft...
              </Text>
            )
          ) : (
            <TouchableOpacity
              onPress={handleBreakFinished}
              className="w-20 h-20 rounded-full items-center justify-center border-2 border-gray-600 bg-[#111]"
            >
              <Ionicons name="stop" size={28} color="white" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={handleBreakFinished}
          className="absolute bottom-12 border border-gray-800 py-4 px-10 rounded-2xl"
        >
          <Text className="font-bold tracking-widest text-xs text-gray-500 uppercase">Pause Überspringen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- DONE MODE: 3 options ---
  return (
    <View className="flex-1 bg-black justify-center items-center px-6">
      <View className="bg-green-500/20 p-6 rounded-full mb-8">
        <Ionicons name="battery-charging" size={48} color="#22c55e" />
      </View>

      <Text className="text-white text-3xl font-extrabold uppercase tracking-widest mb-2">Recharged</Text>
      <Text className="text-gray-400 text-center mb-12 leading-6">
        Dein Gehirn ist wieder aufnahmefähig. Was steht als Nächstes an?
      </Text>

      <View className="w-full gap-y-3">
        {/* Next block: skip Gate entirely */}
        <TouchableOpacity
          onPress={() => navigation.replace('Focus')}
          className="w-full py-4 rounded-2xl items-center border-[1px] bg-white border-white shadow-lg shadow-white/20"
        >
          <Text className="font-bold tracking-widest text-sm uppercase text-black">Nächster Block</Text>
        </TouchableOpacity>

        {/* Restart: go back to Gate (Phase 1) */}
        <TouchableOpacity
          onPress={() => navigation.replace('Gate')}
          className="w-full py-4 rounded-2xl items-center border-[1px] bg-transparent border-gray-700"
        >
          <Text className="font-bold tracking-widest text-sm uppercase text-gray-400">Neustart</Text>
        </TouchableOpacity>

        {/* End session */}
        <TouchableOpacity
          onPress={finishSession}
          className="py-4 items-center w-full"
        >
          <Text className="text-gray-600 text-sm font-medium">Feierabend</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
