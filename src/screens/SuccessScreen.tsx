import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, BackHandler, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getTimeoutEnabled, getSessionIntention } from '../store/storage';

export default function SuccessScreen({ route, navigation }: any) {
  const { minutes } = route.params || { minutes: 0 };
  const xpEarned = minutes * 10;

  const [showTimeoutBtn, setShowTimeoutBtn] = useState(false);
  const [brainDump, setBrainDump] = useState('');

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    const checkConfig = async () => {
      const enabled = await getTimeoutEnabled();
      setShowTimeoutBtn(enabled);

      const intention = await getSessionIntention();
      if (intention && intention.brainDump) {
        setBrainDump(intention.brainDump);
      }
    };
    checkConfig();

    return () => backHandler.remove();
  }, []);

  return (
    <View className="flex-1 bg-black px-6 pt-16 pb-8">

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center w-full mt-8">
          {/* XP Anzeige */}
          <View className="items-center mb-10">
            <Ionicons name="trophy" size={80} color="#fbbf24" />
            <Text className="text-yellow-400 text-6xl font-bold mt-4">+{xpEarned}</Text>
            <Text className="text-gray-500 text-xs tracking-[4px] uppercase font-bold mt-2">XP Gained</Text>
          </View>

          <Text className="text-white text-3xl font-bold text-center mb-2">
            Session Complete
          </Text>
          <Text className="text-gray-400 text-center mb-10 px-4 leading-6">
            Hervorragende Arbeit. Dein Fokus war {minutes} Minuten lang ununterbrochen.
          </Text>
        </View>

        {/* --- RETURN OF THE BRAIN DUMP --- */}
        {brainDump.trim().length > 0 && (
          <View className="w-full bg-[#111] p-6 rounded-3xl border border-gray-800 mb-10">
            <View className="flex-row items-center mb-3">
              <Ionicons name="lock-open" size={20} color="#9ca3af" />
              <Text className="text-gray-400 text-xs font-bold tracking-widest uppercase ml-2">
                The Return of the Brain Dump
              </Text>
            </View>
            <Text className="text-white font-bold mb-4">
              Super gearbeitet! Du kannst dich jetzt um diese Dinge kümmern:
            </Text>
            <View className="bg-black/50 p-4 rounded-2xl border border-gray-800">
              <Text className="text-gray-300 leading-6">
                {brainDump}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* --- FOOTER BUTTONS --- */}
      <View className="w-full mt-auto pt-4">
        {showTimeoutBtn && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.replace('Timeout');
            }}
            className="w-full bg-blue-900/30 border border-blue-500/50 py-4 rounded-2xl items-center mb-4 flex-row justify-center"
          >
            <Ionicons name="cafe-outline" size={20} color="#60a5fa" style={{ marginRight: 10 }} />
            <Text className="text-blue-400 font-bold tracking-widest text-sm">RECOVER & PAUSE</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.navigate('Home');
          }}
          className="w-full bg-white py-4 rounded-2xl items-center flex-row justify-center"
        >
          <Text className="text-black font-bold tracking-widest text-sm">CLAIM & RETURN</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}