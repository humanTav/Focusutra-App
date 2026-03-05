import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getChecklistItems, saveChecklistItems,
  getChecklistEnabled, saveChecklistEnabled,
  getTimeoutActivities, saveTimeoutActivities,
  getTimeoutEnabled, saveTimeoutEnabled,
  getFocusSound, saveFocusSound,
  getFocusSoundEnabled, saveFocusSoundEnabled,
  getBreathingEnabled, saveBreathingEnabled,
  getBreathingMethod, saveBreathingMethod
} from '../store/storage';

// --- DATA ---
const SOUND_OPTIONS = [
  { id: 'binauralbeats', title: '40-Hz Binaural Beats', desc: 'Analytischer Neuro-Fokus' },
  { id: 'rain', title: '60 BPM Barock', desc: 'Entspannter Alpha-Zustand' },
];

const BREATHING_OPTIONS = [
  { id: 'box_breathing', title: 'Box Breathing', desc: 'Stabilize & Focus (Navy SEAL)' },
  { id: 'double_inhale', title: 'Physiological Sigh', desc: 'Calm Alertness (Huberman)' },
];

export default function BuilderScreen({ navigation }: any) {
  // --- STATE ---
  const [checklistEnabled, setChecklistEnabled] = useState(true);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [checklistModalVisible, setChecklistModalVisible] = useState(false);

  const [breathingEnabled, setBreathingEnabled] = useState(true);
  const [selectedBreathing, setSelectedBreathing] = useState('box_breathing');
  const [breathingModalVisible, setBreathingModalVisible] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState('binauralbeats');
  const [focusModalVisible, setFocusModalVisible] = useState(false);

  const [timeoutEnabled, setTimeoutEnabled] = useState(true);
  const [timeoutItems, setTimeoutItems] = useState<any[]>([]);
  const [timeoutModalVisible, setTimeoutModalVisible] = useState(false);

  // --- LOAD DATA ---
  const loadData = useCallback(async () => {
    setChecklistEnabled(await getChecklistEnabled());
    setChecklistItems(await getChecklistItems());
    setBreathingEnabled(await getBreathingEnabled());
    setSelectedBreathing(await getBreathingMethod());
    setSoundEnabled(await getFocusSoundEnabled());
    setSelectedSound(await getFocusSound());
    setTimeoutEnabled(await getTimeoutEnabled());
    setTimeoutItems(await getTimeoutActivities());
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // --- HANDLERS ---
  const toggleChecklist = async () => { const v = !checklistEnabled; setChecklistEnabled(v); await saveChecklistEnabled(v); };
  const toggleChecklistItem = async (id: string) => { const n = checklistItems.map(i => i.id === id ? { ...i, selected: !i.selected } : i); setChecklistItems(n); await saveChecklistItems(n); };

  const toggleBreathing = async () => { const v = !breathingEnabled; setBreathingEnabled(v); await saveBreathingEnabled(v); };
  const handleSelectBreathing = async (id: string) => { setSelectedBreathing(id); await saveBreathingMethod(id); };

  const toggleSound = async () => { const v = !soundEnabled; setSoundEnabled(v); await saveFocusSoundEnabled(v); };
  const handleSelectSound = async (id: string) => { setSelectedSound(id); await saveFocusSound(id); };

  const toggleTimeout = async () => { const v = !timeoutEnabled; setTimeoutEnabled(v); await saveTimeoutEnabled(v); };
  const toggleTimeoutItem = async (id: string) => { const n = timeoutItems.map(i => i.id === id ? { ...i, selected: !i.selected } : i); setTimeoutItems(n); await saveTimeoutActivities(n); };

  // --- HELPER STRINGS ---
  const getSoundTitle = () => SOUND_OPTIONS.find(o => o.id === selectedSound)?.title || 'Silent';
  const getBreathTitle = () => BREATHING_OPTIONS.find(o => o.id === selectedBreathing)?.title || 'Box Breathing';
  const getChecklistCount = () => checklistItems.filter(i => i.selected).length;
  const getTimeoutCount = () => timeoutItems.filter(i => i.selected).length;

  // --- TIMELINE STEP COMPONENT ---
  const TimelineStep = ({
    icon, title, subtitle, isEnabled, isLast, onPress
  }: { icon: any, title: string, subtitle: string, isEnabled: boolean, isLast?: boolean, onPress: () => void }) => (
    <View className="flex-row w-full">
      <View className="items-center mr-6">
        <View className={`w-10 h-10 rounded-full items-center justify-center border-2 ${isEnabled ? 'bg-white border-white' : 'bg-[#111] border-gray-800'}`}>
          <Ionicons name={icon} size={20} color={isEnabled ? 'black' : '#4b5563'} />
        </View>
        {!isLast && (
          <View className={`w-0.5 flex-1 my-2 ${isEnabled ? 'bg-gray-700' : 'bg-gray-900'}`} />
        )}
      </View>

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          borderWidth: 1,
          borderColor: isEnabled ? '#374151' : '#1f2937',
          backgroundColor: isEnabled ? '#111' : 'black',
          opacity: isEnabled ? 1 : 0.6
        }}
        className="flex-1 mb-6 p-5 rounded-2xl"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className={`text-xs font-bold tracking-widest uppercase mb-1 ${isEnabled ? 'text-gray-400' : 'text-gray-700'}`}>
              {title}
            </Text>
            <Text className={`text-lg font-bold ${isEnabled ? 'text-white' : 'text-gray-600'}`}>
              {subtitle}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#4b5563" />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    // FIX: style={{ backgroundColor: 'black' }} erzwingt Schwarz auf dem Root-View
    <View className="flex-1 bg-black px-6 pt-20">

      {/* HEADER */}
      <View className="flex-row justify-between items-center mb-10">
        <View>
          <Text className="text-gray-500 text-xs font-bold tracking-[2px] uppercase mb-1">Session Protocol</Text>
          <Text className="text-white text-3xl font-bold">Your Ritual</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} className="bg-[#111] p-2 rounded-full border border-gray-800">
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* TIMELINE SCROLL */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="bg-black"
      >
        <TimelineStep icon="list" title="Step 1: Preparation" subtitle={checklistEnabled ? `${getChecklistCount()} rituals active` : 'Skipped'} isEnabled={checklistEnabled} onPress={() => setChecklistModalVisible(true)} />
        <TimelineStep icon="body" title="Step 2: Physiology" subtitle={breathingEnabled ? getBreathTitle() : 'Skipped'} isEnabled={breathingEnabled} onPress={() => setBreathingModalVisible(true)} />
        <TimelineStep icon="pulse" title="Step 3: Deep Work" subtitle={soundEnabled ? getSoundTitle() : 'Silent Mode'} isEnabled={true} onPress={() => setFocusModalVisible(true)} />
        <TimelineStep icon="cafe" title="Step 4: Decompression" subtitle={timeoutEnabled ? `${getTimeoutCount()} protocols` : 'Skipped'} isEnabled={timeoutEnabled} isLast={true} onPress={() => setTimeoutModalVisible(true)} />
      </ScrollView>

      {/* --- MODAL 1: CHECKLIST --- */}
      <Modal animationType="slide" transparent={true} visible={checklistModalVisible} onRequestClose={() => setChecklistModalVisible(false)}>
        <View className="flex-1 justify-end">
          <Pressable className="absolute top-0 bottom-0 left-0 right-0 bg-black/80" onPress={() => setChecklistModalVisible(false)} />
          <View className="bg-[#111] rounded-t-3xl border-t border-gray-800 p-6 pb-12 h-[70%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-bold">Preparation Rituals</Text>
              <Switch value={checklistEnabled} onValueChange={toggleChecklist} trackColor={{ false: "#333", true: "#22c55e" }} thumbColor={"#fff"} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-y-3">
                {checklistItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => checklistEnabled && toggleChecklistItem(item.id)}
                    activeOpacity={0.7}
                    // MASTER FIX: minHeight & transparente Icons verhindern Layout-Shifts
                    style={{
                      borderWidth: 1,
                      minHeight: 56, // Festgenagelte Höhe
                      borderColor: !checklistEnabled ? '#1f2937' : (item.selected ? '#22c55e' : '#1f2937'),
                      backgroundColor: !checklistEnabled ? '#111' : (item.selected ? 'rgba(34, 197, 94, 0.1)' : '#111'),
                      opacity: !checklistEnabled ? 0.3 : 1
                    }}
                    className="px-4 rounded-xl flex-row justify-between items-center"
                    disabled={!checklistEnabled}
                  >
                    <Text className={`font-bold flex-1 ${item.selected ? 'text-white' : 'text-gray-400'}`}>{item.text}</Text>
                    {/* TRICK: Icon ist immer da, nur die Farbe ändert sich zu transparent */}
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={item.selected ? "#22c55e" : "transparent"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity onPress={() => setChecklistModalVisible(false)} className="mt-6 bg-white py-4 rounded-2xl items-center shadow-lg shadow-white/10"><Text className="font-bold text-black">SAVE STEP 1</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 2: BREATHING --- */}
      <Modal animationType="slide" transparent={true} visible={breathingModalVisible} onRequestClose={() => setBreathingModalVisible(false)}>
        <View className="flex-1 justify-end">
          <Pressable className="absolute top-0 bottom-0 left-0 right-0 bg-black/80" onPress={() => setBreathingModalVisible(false)} />
          <View className="bg-[#111] rounded-t-3xl border-t border-gray-800 p-6 pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-bold">Physiological State</Text>
              <Switch value={breathingEnabled} onValueChange={toggleBreathing} trackColor={{ false: "#333", true: "#22c55e" }} thumbColor={"#fff"} />
            </View>
            <View className="gap-y-4">
              <View
                style={{
                  borderWidth: 1,
                  borderColor: !breathingEnabled ? '#1f2937' : '#22c55e',
                  backgroundColor: !breathingEnabled ? '#111' : 'rgba(34, 197, 94, 0.1)',
                  opacity: !breathingEnabled ? 0.3 : 1
                }}
                className="p-5 rounded-2xl"
              >
                <View className="flex-row justify-between items-center mb-1">
                  <Text className={`text-lg font-bold ${breathingEnabled ? 'text-white' : 'text-gray-400'}`}>Dynamic Adaptation</Text>
                  <Ionicons name="flash" size={24} color={breathingEnabled ? "#22c55e" : "transparent"} />
                </View>
                <Text className="text-gray-500 text-xs mt-2 leading-5">
                  Das Protokoll passt sich automatisch deinem aktuellen Stresslevel an (Müde, Gestresst, Bereit).
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setBreathingModalVisible(false)} className="mt-8 bg-white py-4 rounded-2xl items-center shadow-lg shadow-white/10"><Text className="font-bold text-black">SAVE STEP 2</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 3: SOUND --- */}
      <Modal animationType="slide" transparent={true} visible={focusModalVisible} onRequestClose={() => setFocusModalVisible(false)}>
        <View className="flex-1 justify-end">
          <Pressable className="absolute top-0 bottom-0 left-0 right-0 bg-black/80" onPress={() => setFocusModalVisible(false)} />
          <View className="bg-[#111] rounded-t-3xl border-t border-gray-800 p-6 pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-bold">Background Audio</Text>
              <Switch value={soundEnabled} onValueChange={toggleSound} trackColor={{ false: "#333", true: "#22c55e" }} thumbColor={"#fff"} />
            </View>
            <View className="gap-y-4">
              {SOUND_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => soundEnabled && handleSelectSound(option.id)}
                  activeOpacity={0.7}
                  style={{
                    borderWidth: 1,
                    borderColor: !soundEnabled ? '#1f2937' : (selectedSound === option.id ? '#22c55e' : '#1f2937'),
                    backgroundColor: !soundEnabled ? '#111' : (selectedSound === option.id ? 'rgba(34, 197, 94, 0.1)' : '#111'),
                    opacity: !soundEnabled ? 0.3 : 1
                  }}
                  className="p-5 rounded-2xl"
                  disabled={!soundEnabled}
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className={`text-lg font-bold ${selectedSound === option.id && soundEnabled ? 'text-white' : 'text-gray-400'}`}>{option.title}</Text>
                    <Ionicons name="volume-high" size={24} color={selectedSound === option.id && soundEnabled ? "#22c55e" : "transparent"} />
                  </View>
                  <Text className="text-gray-500 text-xs">{option.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setFocusModalVisible(false)} className="mt-8 bg-white py-4 rounded-2xl items-center shadow-lg shadow-white/10"><Text className="font-bold text-black">SAVE STEP 3</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 4: TIMEOUT --- */}
      <Modal animationType="slide" transparent={true} visible={timeoutModalVisible} onRequestClose={() => setTimeoutModalVisible(false)}>
        <View className="flex-1 justify-end">
          <Pressable className="absolute top-0 bottom-0 left-0 right-0 bg-black/80" onPress={() => setTimeoutModalVisible(false)} />
          <View className="bg-[#111] rounded-t-3xl border-t border-gray-800 p-6 pb-12 h-[70%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-bold">Decompression</Text>
              <Switch value={timeoutEnabled} onValueChange={toggleTimeout} trackColor={{ false: "#333", true: "#22c55e" }} thumbColor={"#fff"} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-y-3">
                {timeoutItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => timeoutEnabled && toggleTimeoutItem(item.id)}
                    activeOpacity={0.7}
                    // FIX: minHeight & transparent Icons
                    style={{
                      borderWidth: 1,
                      minHeight: 56,
                      borderColor: !timeoutEnabled ? '#1f2937' : (item.selected ? '#22c55e' : '#1f2937'),
                      backgroundColor: !timeoutEnabled ? '#111' : (item.selected ? 'rgba(34, 197, 94, 0.1)' : '#111'),
                      opacity: !timeoutEnabled ? 0.3 : 1
                    }}
                    className="px-4 rounded-xl flex-row justify-between items-center"
                    disabled={!timeoutEnabled}
                  >
                    <Text className={`font-bold flex-1 ${item.selected ? 'text-white' : 'text-gray-400'}`}>{item.text}</Text>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={item.selected ? "#22c55e" : "transparent"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity onPress={() => setTimeoutModalVisible(false)} className="mt-6 bg-white py-4 rounded-2xl items-center shadow-lg shadow-white/10"><Text className="font-bold text-black">SAVE STEP 4</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}