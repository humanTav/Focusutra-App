import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { getTimeoutActivities, DEFAULT_TIMEOUT_ACTIVITIES } from '../store/storage';

type ScreenMode = 'selection' | 'quick' | 'nsdr' | 'done';

export default function TimeoutScreen({ navigation }: any) {
  useKeepAwake();

  // --- STATE ---
  const [mode, setMode] = useState<ScreenMode>('selection');
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Quick Break State
  const [isFaceDown, setIsFaceDown] = useState(false);
  const [currentActivity, setCurrentActivity] = useState({ text: "Panoramic Vision (Fensterblick)" });

  // NSDR State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- 1. INITIAL LOAD (Random Activity) ---
  useEffect(() => {
    const load = async () => {
      const allItems = await getTimeoutActivities();
      const activeItems = allItems.filter((i: any) => i.selected);
      const pool = activeItems.length > 0 ? activeItems : DEFAULT_TIMEOUT_ACTIVITIES;

      const randomItem = pool[Math.floor(Math.random() * pool.length)];
      setCurrentActivity(randomItem);
    };
    load();

    // Audio Cleanup beim Verlassen des Screens
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // --- 2. SENSOR LOGIK (Nur aktiv im 'quick' Modus) ---
  useEffect(() => {
    if (mode !== 'quick') return;

    Accelerometer.setUpdateInterval(200);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const faceDown = z > 0.9 && Math.abs(x) < 0.2 && Math.abs(y) < 0.2;
      setIsFaceDown(faceDown);
    });
    return () => subscription.remove();
  }, [mode]);

  // --- 3. TIMER LOGIK ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Timer läuft, wenn: (Quick Mode + Handy umgedreht) ODER (NSDR Mode + Audio spielt)
    const shouldRunTimer =
      (mode === 'quick' && isFaceDown) ||
      (mode === 'nsdr' && isPlaying);

    if (shouldRunTimer && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && (mode === 'quick' || mode === 'nsdr')) {
      handleBreakFinished();
    }

    return () => clearInterval(interval);
  }, [mode, isFaceDown, isPlaying, secondsLeft]);

  // --- 4. AUDIO LOGIK (NSDR) ---
  const toggleAudio = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!sound) {
      // TODO: Ersetze das require durch dein eigenes NSDR-Audio-File im assets Ordner!
      // z.B. require('../assets/nsdr_huberman.mp3')
      // Für jetzt simulieren wir es einfach, damit die App nicht crasht, wenn das File fehlt.
      try {
        /* const { sound: newSound } = await Audio.Sound.createAsync(
           require('../assets/nsdr.mp3') 
        );
        setSound(newSound);
        await newSound.playAsync();
        */
        setIsPlaying(true);
      } catch (e) {
        console.log("Audio Error:", e);
        setIsPlaying(true); // Fallback: Timer läuft auch ohne echtes Audio weiter
      }
    } else {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  // --- 5. HANDLERS ---
  const startQuickBreak = () => {
    setSecondsLeft(5 * 60); // 5 Minuten
    setMode('quick');
  };

  const startNSDR = () => {
    setSecondsLeft(20 * 60); // 20 Minuten
    setMode('nsdr');
  };

  const handleBreakFinished = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (sound) await sound.stopAsync();
    setIsPlaying(false);
    setMode('done');
  };

  const finishCompletely = () => {
    if (sound) sound.unloadAsync();
    // Leitet zum SuccessScreen weiter, wo der Brain Dump auf ihn wartet
    navigation.replace('Success');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- RENDERERS FÜR DIE VERSCHIEDENEN MODI ---

  // MODUS 1: DIE AUSWAHL (Pit Stop)
  if (mode === 'selection') {
    return (
      <View className="flex-1 bg-black px-6 pt-24 pb-12 justify-between">
        <View>
          <Text className="text-gray-500 text-xs font-bold tracking-[2px] uppercase mb-1">Session Complete</Text>
          <Text className="text-white text-4xl font-bold tracking-tighter mb-8">The Pit Stop</Text>
          <Text className="text-gray-400 text-base mb-10 leading-6">
            Dein Gehirn braucht jetzt Zeit, um neuroplastische Verbindungen zu festigen. Wähle deine Erholung.
          </Text>

          {/* Option A: NSDR */}
          <TouchableOpacity onPress={startNSDR} activeOpacity={0.8} className="bg-[#111] border border-gray-800 p-6 rounded-3xl mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white text-xl font-bold">NSDR Protocol</Text>
              <View className="bg-gray-800 px-3 py-1 rounded-full">
                <Text className="text-gray-300 text-xs font-bold">20 Min</Text>
              </View>
            </View>
            <Text className="text-gray-500 text-sm">Geführte Tiefenentspannung (Audio). Reduziert Stress sofort.</Text>
          </TouchableOpacity>

          {/* Option B: Quick Break */}
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

        {/* FEIERABEND BUTTON */}
        <TouchableOpacity
          onPress={finishCompletely}
          className="border border-red-900/50 bg-red-900/10 py-5 rounded-2xl items-center flex-row justify-center"
        >
          <Ionicons name="flag" size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Text className="text-red-500 font-bold tracking-widest text-sm">FEIERABEND MACHEN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // MODUS 2 & 3: AKTIVE PAUSE (Quick oder NSDR)
  if (mode === 'quick' || mode === 'nsdr') {
    return (
      <View className="flex-1 bg-black justify-center items-center px-6">

        <Text className="text-gray-500 text-xs font-bold tracking-[4px] uppercase mb-8">
          {mode === 'nsdr' ? 'NSDR Audio Protocol' : 'Digital Detox'}
        </Text>

        {/* TIMER */}
        <Text className={`text-8xl font-bold font-mono my-8 ${(mode === 'quick' && isFaceDown) || (mode === 'nsdr' && isPlaying) ? 'text-white' : 'text-gray-600'
          }`}>
          {formatTime(secondsLeft)}
        </Text>

        {/* CONTROLS ODER SENSOR-FEEDBACK */}
        <View className="h-32 justify-center w-full items-center">
          {mode === 'quick' ? (
            // Feedback für Offline Pause
            !isFaceDown ? (
              <View className="bg-red-900/20 px-6 py-4 rounded-2xl border border-red-500 w-full animate-pulse">
                <Text className="text-red-500 text-xl font-extrabold text-center uppercase tracking-widest">KEINE HANDYZEIT!</Text>
                <Text className="text-red-400 text-xs text-center mt-1">Gerät flach auf den Tisch legen.</Text>
              </View>
            ) : (
              <Text className="text-blue-400 text-sm font-bold tracking-widest uppercase text-center">
                Erholung läuft...
              </Text>
            )
          ) : (
            // Audio Controls für NSDR
            <TouchableOpacity
              onPress={toggleAudio}
              className={`w-20 h-20 rounded-full items-center justify-center border-2 ${isPlaying ? 'border-gray-600 bg-[#111]' : 'border-green-500 bg-green-500/20'}`}
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={32} color={isPlaying ? "white" : "#22c55e"} style={{ marginLeft: isPlaying ? 0 : 4 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* PAUSE ÜBERSPRINGEN / ABBRECHEN */}
        {(!isFaceDown || mode === 'nsdr') && (
          <TouchableOpacity
            onPress={handleBreakFinished}
            className="absolute bottom-12 border border-gray-800 py-4 px-10 rounded-2xl active:bg-gray-900"
          >
            <Text className="font-bold tracking-widest text-xs text-gray-500">PAUSE ÜBERSPRINGEN</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // MODUS 4: PAUSE BEENDET (Entscheidung für die nächste Runde)
  return (
    <View className="flex-1 bg-black justify-center items-center px-6">
      <View className="bg-green-500/20 p-6 rounded-full mb-8">
        <Ionicons name="battery-charging" size={48} color="#22c55e" />
      </View>

      <Text className="text-white text-3xl font-extrabold uppercase tracking-widest mb-2">Recharged</Text>
      <Text className="text-gray-400 text-center mb-16 px-4">
        Dein Gehirn ist wieder aufnahmefähig. Was steht als Nächstes an?
      </Text>

      <View className="w-full gap-y-4">
        {/* ZURÜCK IN DEN TUNNEL (Überspringt die Intention, da das Ziel gleich bleibt) */}
        <TouchableOpacity
          onPress={() => navigation.replace('Focus', { skipSetup: true })}
          className="bg-white py-5 rounded-2xl items-center w-full shadow-lg shadow-white/20 active:bg-gray-200"
        >
          <Text className="text-black font-extrabold tracking-widest text-sm">NÄCHSTER FOKUS-BLOCK</Text>
        </TouchableOpacity>

        {/* FEIERABEND */}
        <TouchableOpacity
          onPress={finishCompletely}
          className="bg-[#111] border border-gray-800 py-5 rounded-2xl items-center w-full active:bg-[#222]"
        >
          <Text className="text-gray-400 font-bold tracking-widest text-sm">FEIERABEND (ZUM BRAIN DUMP)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}