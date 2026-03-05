import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Vibration, Alert, Dimensions } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';

import { saveSession, getFocusSound, getFocusSoundEnabled } from '../store/storage';

// --- CONFIG ---
const SENSOR_INTERVAL_ACTIVE = 500;
const SENSOR_INTERVAL_ARMED = 200;

const SOUND_MAP: Record<string, any> = {
  'brownnoise': require('../../assets/sounds/brownnoise.mp3'),
  'rain': require('../../assets/sounds/rain.mp3'),
  'binauralbeats': require('../../assets/sounds/binauralbeats.mp3'),
};

const SOUND_TITLES: Record<string, string> = {
  'brownnoise': 'Brown Noise',
  'rain': 'Heavy Rain',
  'binauralbeats': 'Binaural Beats',
  'silent': 'Silent Mode',
};

const FOCUS_OPTIONS = [
  { label: 'TEST', value: 5 },
  { label: '30m', value: 30 * 60 },
  { label: '60m', value: 60 * 60 },
  { label: '90m', value: 90 * 60 },
];

type FocusPhase = 'flip_prompt' | 'active';

export default function FocusScreen({ navigation }: any) {
  useKeepAwake();

  // --- STATE ---
  const [selectedOption, setSelectedOption] = useState(FOCUS_OPTIONS[1]);
  const [secondsLeft, setSecondsLeft] = useState(selectedOption.value);

  const [phase, setPhase] = useState<FocusPhase>('flip_prompt');

  const [isFaceDown, setIsFaceDown] = useState(false);
  const [isAlarming, setIsAlarming] = useState(false);

  const [penaltySeconds, setPenaltySeconds] = useState(5);
  const [activeSoundName, setActiveSoundName] = useState('Loading...');
  const [flashWhite, setFlashWhite] = useState(false);

  // Refs
  const soundObject = useRef<Audio.Sound | null>(null);
  const isFinishingRef = useRef(false);

  // --- 1. INIT SOUND ---
  useEffect(() => {
    const init = async () => {
      const isEnabled = await getFocusSoundEnabled();
      if (!isEnabled) {
        setActiveSoundName('Silent Mode');
      } else {
        const soundId = await getFocusSound();
        setActiveSoundName(SOUND_TITLES[soundId] || 'Unknown Sound');
      }
    };
    init();
  }, []);

  // --- 2. SENSOR ---
  useEffect(() => {
    const interval = phase === 'active' ? SENSOR_INTERVAL_ACTIVE : SENSOR_INTERVAL_ARMED;
    Accelerometer.setUpdateInterval(interval);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const faceDown = z > 0.9 && Math.abs(x) < 0.2 && Math.abs(y) < 0.2;
      setIsFaceDown(faceDown);

      if (faceDown && phase === 'flip_prompt' && !isAlarming && !isFinishingRef.current) {
        setPhase('active');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    });

    return () => subscription.remove();
  }, [phase, isAlarming]);

  // --- 3. AUDIO ENGINE ---
  useEffect(() => {
    let shouldPlay = phase === 'active' && isFaceDown && !isAlarming;

    const manageAudio = async () => {
      if (shouldPlay) {
        if (soundObject.current) {
          const status = await soundObject.current.getStatusAsync();
          if (status.isLoaded && !status.isPlaying) {
            await soundObject.current.playAsync();
          }
        } else {
          const isEnabled = await getFocusSoundEnabled();
          if (!isEnabled) return;

          const soundId = await getFocusSound();
          if (SOUND_MAP[soundId]) {
            try {
              await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
              });
              const { sound } = await Audio.Sound.createAsync(
                SOUND_MAP[soundId],
                { isLooping: true, volume: 0.8, shouldPlay: true }
              );
              soundObject.current = sound;
            } catch (e) {
              console.warn('[Audio] Error', e);
            }
          }
        }
      } else {
        if (soundObject.current) {
          const status = await soundObject.current.getStatusAsync();
          if (status.isLoaded) {
            if (isAlarming) {
              await soundObject.current.stopAsync();
            } else {
              await soundObject.current.pauseAsync();
            }
          }
        }
      }
    };
    manageAudio();
  }, [phase, isFaceDown, isAlarming]);

  useEffect(() => {
    return () => {
      if (soundObject.current) {
        soundObject.current.unloadAsync();
      }
    };
  }, []);

  // --- 4. ACTIVE TIMER ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'active' && isFaceDown && !isAlarming && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && !isAlarming && phase === 'active') {
      setIsAlarming(true);
    }
    return () => clearInterval(interval);
  }, [phase, isFaceDown, isAlarming, secondsLeft]);

  // --- 5. PENALTY (Handy angehoben) ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'active' && !isFaceDown && !isAlarming && secondsLeft > 0) {
      interval = setInterval(() => {
        setPenaltySeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSessionFailed();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (penaltySeconds !== 5) setPenaltySeconds(5);
    }
    return () => clearInterval(interval);
  }, [phase, isFaceDown, isAlarming, secondsLeft]);

  // --- 6. ALARM (Session Ende) ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAlarming) {
      const triggerAlarm = async () => {
        setFlashWhite((prev) => !prev);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Vibration.vibrate(400);
      };
      triggerAlarm();
      interval = setInterval(triggerAlarm, 1500);
    } else {
      setFlashWhite(false);
      Vibration.cancel();
    }
    return () => { clearInterval(interval); Vibration.cancel(); };
  }, [isAlarming]);

  // --- 7. FINISH CHECK ---
  useEffect(() => {
    if (isAlarming && !isFaceDown) {
      finishSession();
    }
  }, [isAlarming, isFaceDown]);

  // --- HANDLERS ---
  const handleSessionFailed = async () => {
    if (soundObject.current) {
      try {
        await soundObject.current.stopAsync();
        await soundObject.current.unloadAsync();
      } catch (e) { }
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert("SESSION FAILED", "Gerät zu lange angehoben.", [{ text: "OK", onPress: () => navigation.goBack() }]);
  };

  const finishSession = async () => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    setIsAlarming(false);

    if (soundObject.current) {
      try {
        await soundObject.current.stopAsync();
        await soundObject.current.unloadAsync();
      } catch (e) { }
    }

    const minutesToSave = Math.max(1, Math.ceil(selectedOption.value / 60));
    try {
      await saveSession(minutesToSave);
      navigation.replace('Timeout', { minutes: minutesToSave });
    } catch (e) {
      navigation.goBack();
    }
  };

  const handleDurationChange = (option: typeof FOCUS_OPTIONS[0]) => {
    if (phase === 'flip_prompt') {
      Haptics.selectionAsync();
      setSelectedOption(option);
      setSecondsLeft(option.value);
    }
  };

  const cancelSession = async () => {
    if (soundObject.current) {
      try {
        const status = await soundObject.current.getStatusAsync();
        if (status.isLoaded) {
          await soundObject.current.stopAsync();
          await soundObject.current.unloadAsync();
        }
      } catch (e) { }
    }
    navigation.goBack();
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- RENDER ---

  const isDeepFocus = phase === 'active' && isFaceDown && !isAlarming;

  if (isDeepFocus) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text
          style={{
            color: '#111111',
            fontSize: 100,
            fontWeight: '800',
            transform: [{ rotate: '90deg' }]
          }}
        >
          {Math.ceil(secondsLeft / 60)}
        </Text>
      </View>
    );
  }

  const bgClass = flashWhite ? 'bg-white' : 'bg-black';
  const textClass = flashWhite ? 'text-black' : 'text-white';
  const subTextClass = flashWhite ? 'text-gray-600' : 'text-gray-500';

  return (
    <View className={`flex-1 flex-col justify-between items-center px-6 py-12 ${bgClass}`}>

      {/* HEADER */}
      <View className="items-center pt-8">
        <Text className={`text-xs font-bold tracking-[6px] uppercase ${subTextClass}`}>
          Focusutra
        </Text>
      </View>

      {/* MIDDLE CONTENT AREA */}
      <View className="flex-1 w-full items-center justify-center">

        {/* DURATION SELECTOR */}
        {phase === 'flip_prompt' && (
          <View className="flex-row bg-[#111] rounded-full p-1 border border-gray-800 mb-6 shadow-lg shadow-white/5">
            {FOCUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.label}
                onPress={() => handleDurationChange(option)}
                className={`px-5 py-2.5 rounded-full transition-all ${selectedOption.value === option.value ? 'bg-white shadow-sm' : 'bg-transparent'}`}
              >
                <Text className={`font-bold text-xs tracking-wider ${selectedOption.value === option.value ? 'text-black' : 'text-gray-500'}`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* HUGE TIMER */}
        <View className="items-center w-full mb-8">
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className={`font-bold font-mono text-8xl text-center w-full tracking-tighter ${isAlarming ? textClass : 'text-white'}`}
          >
            {formatTime(secondsLeft)}
          </Text>
          <View className="flex-row items-center mt-2 opacity-60">
            <Ionicons name="musical-notes" size={12} color={flashWhite ? "black" : "#9ca3af"} style={{ marginRight: 6 }} />
            <Text className={`text-xs font-bold tracking-[2px] uppercase ${flashWhite ? 'text-black' : 'text-gray-400'}`}>
              {activeSoundName}
            </Text>
          </View>
        </View>

        {/* INFO CARDS */}
        <View className="w-full">
          {isAlarming ? (
            <View className={`px-6 py-8 rounded-[32px] border-2 w-full shadow-2xl ${flashWhite ? 'bg-black border-black shadow-black/50' : 'bg-white border-white shadow-white/20'}`}>
              <Text className={`text-3xl font-extrabold text-center uppercase tracking-widest mb-2 ${flashWhite ? 'text-white' : 'text-black'}`}>
                COMPLETE
              </Text>
              <Text className={`text-xs text-center font-bold tracking-widest uppercase ${flashWhite ? 'text-gray-400' : 'text-gray-600'}`}>
                Lift device to finish
              </Text>
            </View>
          ) : phase === 'flip_prompt' ? (

            // NEUES, SCHLICHTES DESIGN FÜR DIE ARMED-CARD
            <View className="bg-[#111] px-6 py-8 rounded-[32px] border border-gray-800 w-full items-center shadow-lg shadow-black/50">
              <View className="flex-row items-center justify-center mb-6">
                <View className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                <Text className="text-blue-400 font-bold tracking-[2px] uppercase text-xs">Sensor Armed</Text>
              </View>

              <Text className="text-white font-semibold text-lg text-center mb-2">
                Turn device face down to start
              </Text>
              <Text className="text-gray-500 text-xs text-center font-medium mb-8">
                Do not lock screen • Wait for haptic signal
              </Text>

              <View className="w-full bg-red-500/10 py-3 rounded-2xl border border-red-500/20">
                <Text className="text-red-400 text-[10px] text-center uppercase font-bold tracking-[2px]">
                  Do not lift until done
                </Text>
              </View>
            </View>

          ) : !isFaceDown && phase === 'active' ? (
            <View className="bg-[#111] px-6 py-6 rounded-[32px] border border-red-900 w-full items-center">
              <Text className="text-red-500 text-2xl font-extrabold text-center uppercase tracking-widest mb-1">WARNING!</Text>
              <Text className="text-red-400 text-xs text-center mb-4 font-bold tracking-widest uppercase">Place face down</Text>
              <Text className="text-red-500 text-6xl font-bold font-mono">
                {penaltySeconds}
              </Text>
            </View>
          ) : null}
        </View>

      </View>

      {/* FOOTER */}
      <View className="w-full items-center">
        <TouchableOpacity
          onPress={cancelSession}
          className={`w-full py-5 rounded-2xl items-center justify-center transition-all ${flashWhite ? 'bg-transparent' : 'bg-transparent active:bg-[#111]'}`}
        >
          <Text className={`font-bold tracking-[3px] text-xs uppercase ${flashWhite ? 'text-black' : 'text-gray-500'}`}>
            Cancel Session
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}