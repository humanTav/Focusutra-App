import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { getBreathingEnabled } from '../store/storage';

interface Props {
  onNext: () => void;
  onSkip: () => void;
  userState?: 'lethargic' | 'stressed' | 'ready' | 'skip' | null;
}

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.25;

export default function GateBreathing({ onNext, onSkip, userState }: Props) {
  // Animation Values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  const [breathInstruction, setBreathInstruction] = useState("Bereit machen...");
  const [timeLeft, setTimeLeft] = useState(60);

  const breathingActive = useRef(true);

  // Determine Title and Explanation based on user state
  const getProtocolInfo = () => {
    switch (userState) {
      case 'lethargic':
        return {
          title: "Hyperventilation",
          desc: "System Up-Regulation. Zwingt den Hirnstamm, Adrenalin auszuschütten, weckt das Nervensystem und beseitigt Müdigkeit sofort.",
          color: "#fbbf24" // Yellow/Energy
        };
      case 'stressed':
        return {
          title: "Physiologischer Seufzer",
          desc: "System Down-Regulation. Aktiviert sofort den Vagusnerv (Ruhenerv) und senkt die Herzfrequenz drastisch, um Panik abzubauen.",
          color: "#22d3ee" // Cyan/Calm
        };
      case 'ready':
      default:
        return {
          title: "4-7-8 Atmung",
          desc: "Etablierung entspannter Wachsamkeit. Fördert Alpha-Gehirnwellen – der perfekte Zustand für tiefen Fokus und Informationsaufnahme.",
          color: "#a855f7" // Purple/Flow
        };
    }
  };

  const info = getProtocolInfo();

  useEffect(() => {
    let currentTimeout: NodeJS.Timeout;

    // --- HELPER: ANIMATIONEN STARTEN ---
    const animateTo = (scale: number, opacity: number, duration: number, easing: any) => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: scale,
          duration: duration,
          useNativeDriver: true,
          easing: easing
        }),
        Animated.timing(opacityAnim, {
          toValue: opacity,
          duration: duration,
          useNativeDriver: true,
          easing: easing
        })
      ]).start();
    };

    // --- 1. ZYKLISCHE HYPERVENTILATION (Für 'lethargic') ---
    const runHyperventilation = () => {
      if (!breathingActive.current) return;

      setBreathInstruction("Kräftig einatmen!");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      animateTo(2.8, 1, 1500, Easing.out(Easing.quad));

      currentTimeout = setTimeout(() => {
        if (!breathingActive.current) return;

        setBreathInstruction("Fallen lassen (Ausatmen)");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        animateTo(1, 0.3, 1000, Easing.in(Easing.quad));

        currentTimeout = setTimeout(() => {
          if (breathingActive.current) runHyperventilation();
        }, 1000);
      }, 1500);
    };

    // --- 2. PHYSIOLOGISCHER SEUFZER (Für 'stressed') ---
    const runPhysioSigh = () => {
      if (!breathingActive.current) return;

      // 1. TIEF EINATMEN
      setBreathInstruction("Tief einatmen...");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      animateTo(2.2, 0.8, 2000, Easing.out(Easing.quad));

      currentTimeout = setTimeout(() => {
        if (!breathingActive.current) return;

        // 2. NACHZIEHEN (DOUBLE INHALE)
        setBreathInstruction("...und nachziehen!");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        animateTo(2.8, 1, 800, Easing.out(Easing.quad));

        currentTimeout = setTimeout(() => {
          if (!breathingActive.current) return;

          // 3. LANGSAM AUSATMEN
          setBreathInstruction("Exteeeeem langsam ausatmen...");
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          animateTo(1, 0.2, 8000, Easing.inOut(Easing.ease));

          currentTimeout = setTimeout(() => {
            if (breathingActive.current) runPhysioSigh();
          }, 8000);
        }, 800);
      }, 2000);
    };

    // --- 3. 4-7-8 ATMUNG (Für 'ready' / Default) ---
    const run478 = () => {
      if (!breathingActive.current) return;

      // 1. EINATMEN (4s)
      setBreathInstruction("Einatmen (4s)");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      animateTo(2.5, 1, 4000, Easing.out(Easing.quad));

      currentTimeout = setTimeout(() => {
        if (!breathingActive.current) return;

        // 2. HALTEN (7s)
        setBreathInstruction("Halten (7s)");

        currentTimeout = setTimeout(() => {
          if (!breathingActive.current) return;

          // 3. AUSATMEN (8s)
          setBreathInstruction("Ausatmen (8s)");
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          animateTo(1, 0.3, 8000, Easing.inOut(Easing.ease));

          currentTimeout = setTimeout(() => {
            if (breathingActive.current) run478();
          }, 8000);
        }, 7000);
      }, 4000);
    };

    // --- START LOGIK ---
    const startSelectedMethod = async () => {
      const isEnabled = await getBreathingEnabled();
      if (!isEnabled) {
        onNext();
        return;
      }

      setTimeout(() => {
        if (!breathingActive.current) return;
        if (userState === 'lethargic') {
          runHyperventilation();
        } else if (userState === 'stressed') {
          runPhysioSigh();
        } else {
          run478();
        }
      }, 2000);
    };

    startSelectedMethod();

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      breathingActive.current = false;
      clearInterval(timerInterval);
      clearTimeout(currentTimeout);
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [userState, scaleAnim, opacityAnim, onNext]);

  useEffect(() => {
    if (timeLeft === 0) {
      onNext();
    }
  }, [timeLeft, onNext]);

  return (
    // HIER ANGEPASST: pt-[100px] statt 60, px-6 entfernt
    <View className="flex-1 w-full pt-[100px] pb-10">

      {/* HEADER */}
      <View className="flex-row justify-between items-start mb-12">
        <View className="flex-1 pr-4">
          <Text className="text-gray-500 text-xs font-bold tracking-[2px] uppercase mb-1">
            Phase 2 • Step 2
          </Text>
          <Text style={{ color: info.color }} className="text-3xl font-bold mb-2">
            {info.title}
          </Text>
        </View>
        <TouchableOpacity onPress={onSkip} className="bg-[#111] p-2 rounded-full border border-gray-800 shrink-0">
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <View className="flex-1 w-full">

        {/* HIER ANGEPASST: text-center für einheitliches Design */}
        <Text className="text-gray-400 text-sm text-center font-medium leading-6 mb-8">
          {info.desc}
        </Text>

        {/* --- ANIMATION CENTER --- */}
        <View className="flex-1 items-center justify-center relative min-h-[40%]">
          {/* Outer Glow Ring (Echo Effect) */}
          <Animated.View
            style={{
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              borderRadius: CIRCLE_SIZE,
              backgroundColor: info.color,
              position: 'absolute',
              opacity: opacityAnim.interpolate({
                inputRange: [0.3, 1],
                outputRange: [0.1, 0.3]
              }),
              transform: [{
                scale: scaleAnim.interpolate({
                  inputRange: [1, 3],
                  outputRange: [1.2, 3.5]
                })
              }]
            }}
          />

          {/* Main Breathing Circle */}
          <Animated.View
            style={{
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              borderRadius: CIRCLE_SIZE,
              backgroundColor: 'white',
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
              shadowColor: info.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 50,
              elevation: 20
            }}
          />
        </View>

        {/* --- FOOTER CONTENT --- */}
        {/* HIER ANGEPASST: mt-auto mb-4 für feste Bodenverankerung exakt wie bei den Buttons */}
        <View className="w-full items-center mt-auto mb-4 flex-col">
          {/* Instructions */}
          <Text className="text-white text-2xl font-bold tracking-widest text-center mb-6 h-10">
            {breathInstruction}
          </Text>

          {/* Timer */}
          <View className="flex-row items-center opacity-50">
            <Ionicons name="hourglass-outline" size={14} color="white" style={{ marginRight: 6 }} />
            <Text className="text-gray-300 text-xs font-mono font-bold tracking-[2px] uppercase">{timeLeft}s remaining</Text>
          </View>
        </View>

      </View>
    </View>
  );
}