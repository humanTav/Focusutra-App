import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Switch,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getChecklistItems, saveChecklistItems,
  getChecklistEnabled, saveChecklistEnabled,
  getFocusSound, saveFocusSound,
  getFocusSoundEnabled, saveFocusSoundEnabled,
  getBreathingEnabled, saveBreathingEnabled,
  getBrainDumpEnabled, saveBrainDumpEnabled,
  getGoalEnabled, saveGoalEnabled,
  getAnchorEnabled, saveAnchorEnabled,
  getAnchorDuration, saveAnchorDuration,
  getRecoveryEnabled, saveRecoveryEnabled,
} from '../store/storage';
import { ChecklistItem } from '../types';

const SOUND_OPTIONS = [
  { id: 'brownnoise', title: 'Brown Noise' },
  { id: 'rain', title: 'Heavy Rain' },
  { id: 'binauralbeats', title: 'Binaural Beats' },
];

const ANCHOR_DURATIONS = [30, 60, 90];

// --- SUB-COMPONENTS ---

const SectionHeader = ({ title }: { title: string }) => (
  <View className="mb-3 mt-8">
    <Text className="text-gray-500 text-xs font-bold tracking-[3px] uppercase">{title}</Text>
  </View>
);

const ToggleRow = ({
  label, value, onToggle, isLast = false,
}: { label: string; value: boolean; onToggle: () => void; isLast?: boolean }) => (
  <View
    style={{ borderWidth: 1, borderColor: '#1f2937', backgroundColor: '#111' }}
    className={`flex-row justify-between items-center px-5 py-4 ${isLast ? 'rounded-b-2xl' : 'rounded-none border-b-0'} first:rounded-t-2xl`}
  >
    <Text className={`font-bold text-base ${value ? 'text-white' : 'text-gray-600'}`}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#333', true: '#22c55e' }}
      thumbColor="#fff"
    />
  </View>
);

// --- MAIN SCREEN ---

export default function BuilderScreen({ navigation }: any) {
  // Phase 1
  const [brainDumpEnabled, setBrainDumpEnabled] = useState(true);
  const [goalEnabled, setGoalEnabled] = useState(true);
  const [checklistEnabled, setChecklistEnabled] = useState(true);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');

  // Phase 2
  const [breathingEnabled, setBreathingEnabled] = useState(true);
  const [anchorEnabled, setAnchorEnabled] = useState(true);
  const [anchorDuration, setAnchorDuration] = useState(30);

  // Phase 3
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState('binauralbeats');

  // Phase 4
  const [recoveryEnabled, setRecoveryEnabled] = useState(true);

  const loadData = useCallback(async () => {
    setBrainDumpEnabled(await getBrainDumpEnabled());
    setGoalEnabled(await getGoalEnabled());
    setChecklistEnabled(await getChecklistEnabled());
    setChecklistItems(await getChecklistItems());
    setBreathingEnabled(await getBreathingEnabled());
    setAnchorEnabled(await getAnchorEnabled());
    setAnchorDuration(await getAnchorDuration());
    setSoundEnabled(await getFocusSoundEnabled());
    setSelectedSound(await getFocusSound());
    setRecoveryEnabled(await getRecoveryEnabled());
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // --- TOGGLE HANDLERS ---
  const toggleBrainDump = async () => { const v = !brainDumpEnabled; setBrainDumpEnabled(v); await saveBrainDumpEnabled(v); };
  const toggleGoal = async () => { const v = !goalEnabled; setGoalEnabled(v); await saveGoalEnabled(v); };
  const toggleChecklist = async () => { const v = !checklistEnabled; setChecklistEnabled(v); await saveChecklistEnabled(v); };
  const toggleBreathing = async () => { const v = !breathingEnabled; setBreathingEnabled(v); await saveBreathingEnabled(v); };
  const toggleAnchor = async () => { const v = !anchorEnabled; setAnchorEnabled(v); await saveAnchorEnabled(v); };
  const handleAnchorDuration = async (d: number) => { setAnchorDuration(d); await saveAnchorDuration(d); };
  const toggleSound = async () => { const v = !soundEnabled; setSoundEnabled(v); await saveFocusSoundEnabled(v); };
  const handleSelectSound = async (id: string) => { setSelectedSound(id); await saveFocusSound(id); };
  const toggleRecovery = async () => { const v = !recoveryEnabled; setRecoveryEnabled(v); await saveRecoveryEnabled(v); };

  // --- CHECKLIST MANAGEMENT ---
  const addChecklistItem = async () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = { id: Date.now().toString(), text: newItemText.trim(), selected: true };
    const updated = [...checklistItems, newItem];
    setChecklistItems(updated);
    setNewItemText('');
    await saveChecklistItems(updated);
  };

  const toggleChecklistItemSelected = async (id: string) => {
    const updated = checklistItems.map(i => i.id === id ? { ...i, selected: !i.selected } : i);
    setChecklistItems(updated);
    await saveChecklistItems(updated);
  };

  const deleteChecklistItem = async (id: string) => {
    const updated = checklistItems.filter(i => i.id !== id);
    setChecklistItems(updated);
    await saveChecklistItems(updated);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-black"
    >
      <View className="flex-1 bg-black px-6 pt-20">

        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className="text-gray-500 text-xs font-bold tracking-[2px] uppercase mb-1">Session Protocol</Text>
            <Text className="text-white text-3xl font-bold">Your Ritual</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-[#111] p-2 rounded-full border border-gray-800"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* ─── PHASE 1: SETUP ─── */}
          <SectionHeader title="Phase 1 — Setup" />

          {/* Toggle group card */}
          <View className="rounded-2xl overflow-hidden border border-gray-800">
            <View className="flex-row justify-between items-center px-5 py-4 bg-[#111] border-b border-gray-800">
              <Text className={`font-bold text-base ${brainDumpEnabled ? 'text-white' : 'text-gray-600'}`}>Brain Dump</Text>
              <Switch value={brainDumpEnabled} onValueChange={toggleBrainDump} trackColor={{ false: '#333', true: '#22c55e' }} thumbColor="#fff" />
            </View>
            <View className="flex-row justify-between items-center px-5 py-4 bg-[#111] border-b border-gray-800">
              <Text className={`font-bold text-base ${goalEnabled ? 'text-white' : 'text-gray-600'}`}>Zielsetzung</Text>
              <Switch value={goalEnabled} onValueChange={toggleGoal} trackColor={{ false: '#333', true: '#22c55e' }} thumbColor="#fff" />
            </View>
            <View className="flex-row justify-between items-center px-5 py-4 bg-[#111]">
              <Text className={`font-bold text-base ${checklistEnabled ? 'text-white' : 'text-gray-600'}`}>Prep Check</Text>
              <Switch value={checklistEnabled} onValueChange={toggleChecklist} trackColor={{ false: '#333', true: '#22c55e' }} thumbColor="#fff" />
            </View>
          </View>

          {/* Checklist editor */}
          {checklistEnabled && (
            <View className="bg-[#111] border border-gray-800 rounded-2xl p-4 mt-3">
              {/* Add new item */}
              <View className="flex-row items-center mb-3">
                <TextInput
                  value={newItemText}
                  onChangeText={setNewItemText}
                  placeholder="Neues Ritual hinzufügen..."
                  placeholderTextColor="#4b5563"
                  style={{
                    flex: 1, color: 'white', fontSize: 14,
                    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14,
                    paddingVertical: 11, borderRadius: 12, borderWidth: 1,
                    borderColor: '#1f2937', marginRight: 10,
                  }}
                  onSubmitEditing={addChecklistItem}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={addChecklistItem}
                  style={{ backgroundColor: 'white', width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="add" size={22} color="black" />
                </TouchableOpacity>
              </View>

              {/* Items list */}
              {checklistItems.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: 12,
                    borderTopWidth: index === 0 ? 1 : 1,
                    borderTopColor: '#1f2937',
                  }}
                >
                  <TouchableOpacity
                    onPress={() => toggleChecklistItemSelected(item.id)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={item.selected ? '#22c55e' : '#4b5563'}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={{ color: item.selected ? 'white' : '#6b7280', fontSize: 14, flex: 1 }} numberOfLines={1}>
                      {item.text}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteChecklistItem(item.id)} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              ))}

              {checklistItems.length === 0 && (
                <Text style={{ color: '#4b5563', fontSize: 12, textAlign: 'center', paddingVertical: 8 }}>
                  Keine Rituale vorhanden.
                </Text>
              )}
            </View>
          )}

          {/* ─── PHASE 2: STATE & PREP ─── */}
          <SectionHeader title="Phase 2 — State & Prep" />

          <View className="rounded-2xl overflow-hidden border border-gray-800">
            <View className="flex-row justify-between items-center px-5 py-4 bg-[#111] border-b border-gray-800">
              <Text className={`font-bold text-base ${breathingEnabled ? 'text-white' : 'text-gray-600'}`}>Atemübungen</Text>
              <Switch value={breathingEnabled} onValueChange={toggleBreathing} trackColor={{ false: '#333', true: '#22c55e' }} thumbColor="#fff" />
            </View>
            <View className="flex-row justify-between items-center px-5 py-4 bg-[#111]">
              <Text className={`font-bold text-base ${anchorEnabled ? 'text-white' : 'text-gray-600'}`}>Visual Anchor</Text>
              <Switch value={anchorEnabled} onValueChange={toggleAnchor} trackColor={{ false: '#333', true: '#22c55e' }} thumbColor="#fff" />
            </View>
          </View>

          {/* Anchor duration selector */}
          {anchorEnabled && (
            <View className="flex-row mt-3 gap-x-2">
              {ANCHOR_DURATIONS.map(d => (
                <TouchableOpacity
                  key={d}
                  onPress={() => handleAnchorDuration(d)}
                  style={{ flex: 1, borderWidth: 1, borderColor: anchorDuration === d ? 'white' : '#374151', backgroundColor: anchorDuration === d ? 'white' : '#111', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontWeight: 'bold', fontSize: 13, color: anchorDuration === d ? 'black' : '#6b7280' }}>{d}s</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ─── PHASE 3: DEEP WORK ─── */}
          <SectionHeader title="Phase 3 — Deep Work" />

          <View className="rounded-2xl overflow-hidden border border-gray-800">
            <View className="flex-row justify-between items-center px-5 py-4 bg-[#111] border-b border-gray-800">
              <Text className={`font-bold text-base ${soundEnabled ? 'text-white' : 'text-gray-600'}`}>Background Sound</Text>
              <Switch value={soundEnabled} onValueChange={toggleSound} trackColor={{ false: '#333', true: '#22c55e' }} thumbColor="#fff" />
            </View>
            {SOUND_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => soundEnabled && handleSelectSound(option.id)}
                activeOpacity={soundEnabled ? 0.7 : 1}
                style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#111',
                  borderTopWidth: 1, borderTopColor: '#1f2937',
                  opacity: soundEnabled ? 1 : 0.4,
                }}
              >
                <Text style={{ fontWeight: 'bold', fontSize: 15, color: selectedSound === option.id && soundEnabled ? 'white' : '#6b7280' }}>
                  {option.title}
                </Text>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={selectedSound === option.id && soundEnabled ? '#22c55e' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* ─── PHASE 4: RECOVERY ─── */}
          <SectionHeader title="Phase 4 — Recovery" />

          <View className="rounded-2xl overflow-hidden border border-gray-800">
            <View className="flex-row justify-between items-center px-5 py-4 bg-[#111]">
              <Text className={`font-bold text-base ${recoveryEnabled ? 'text-white' : 'text-gray-600'}`}>Recovery Phase</Text>
              <Switch value={recoveryEnabled} onValueChange={toggleRecovery} trackColor={{ false: '#333', true: '#22c55e' }} thumbColor="#fff" />
            </View>
          </View>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
