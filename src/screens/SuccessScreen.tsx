import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getRecoveryEnabled } from '../store/storage';

export default function SuccessScreen({ route, navigation }: any) {
  const { minutes } = route.params || { minutes: 0 };
  const [recoveryEnabled, setRecoveryEnabled] = useState(true);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    getRecoveryEnabled().then(setRecoveryEnabled);
    return () => backHandler.remove();
  }, []);

  const startRecovery = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace('Timeout', { minutes });
  };

  const endSession = () => {
    Haptics.selectionAsync();
    navigation.replace('Final', { minutes });
  };

  return (
    <View className="flex-1 bg-black px-6 pt-20 pb-10 justify-between">

      {/* MAIN CONTENT */}
      <View className="flex-1 justify-center items-center">
        <View className="w-20 h-20 rounded-full bg-green-500/20 items-center justify-center mb-8">
          <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
        </View>

        <Text className="text-gray-500 text-xs font-bold tracking-[3px] uppercase mb-3">Session Complete</Text>
        <Text className="text-white text-4xl font-bold text-center mb-8 tracking-tighter">
          Geschafft!
        </Text>

        <View className="bg-[#111] border border-gray-800 rounded-3xl p-6 w-full">
          <View className="flex-row items-center mb-3">
            <Ionicons name="flash" size={16} color="#fbbf24" />
            <Text className="text-yellow-400 text-xs font-bold tracking-[2px] uppercase ml-2">Neuroplastizität</Text>
          </View>
          <Text className="text-gray-300 text-sm leading-6">
            Wichtig: Dein Gehirn darf in der Pause{' '}
            <Text className="text-white font-bold">keine neuen Reize</Text>
            {' '}(wie Social Media) verarbeiten, um Lerneffekte zu konsolidieren.
          </Text>
        </View>
      </View>

      {/* FOOTER */}
      <View className="w-full">
        {recoveryEnabled ? (
          <TouchableOpacity
            onPress={startRecovery}
            className="w-full py-4 rounded-2xl items-center border-[1px] bg-white border-white shadow-lg shadow-white/20 mb-6"
          >
            <Text className="font-bold tracking-widest text-sm uppercase text-black">Recovery Starten</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={endSession}
            className="w-full py-4 rounded-2xl items-center border-[1px] bg-white border-white shadow-lg shadow-white/20 mb-6"
          >
            <Text className="font-bold tracking-widest text-sm uppercase text-black">Session Abschliessen</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={endSession} className="items-center py-3">
          <Text className="text-gray-600 text-sm font-medium">End Session (Feierabend)</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
