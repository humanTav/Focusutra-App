import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onStart: () => void;
}

export default function GateReady({ onStart }: Props) {
  return (
    <View className="items-center w-full">
      <Ionicons name="finger-print" size={80} color="#22c55e" className="mb-8 opacity-80" />
      <Text className="text-gray-500 text-xs tracking-[4px] uppercase font-bold mb-4">Phase 3: Der Fokus</Text>
      <Text className="text-white text-3xl font-bold text-center mb-4">Du bist bereit.</Text>
      <Text className="text-gray-400 text-center mb-16 px-4 leading-6">
        Dein Geist ist ruhig. Dein Ziel ist klar.{"\n"}Betrete jetzt den Tunnel.
      </Text>
      <TouchableOpacity 
        onPress={onStart} 
        className="w-full bg-green-500 h-16 rounded-2xl items-center justify-center shadow-green-900/50 shadow-lg"
      >
        <Text className="text-black text-xl font-bold tracking-widest">SUTRA STARTEN</Text>
      </TouchableOpacity>
    </View>
  );
}