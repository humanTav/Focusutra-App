import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GateIntentionProps {
  onNext: (goal: string, brainDump: string) => void;
  onCancel: () => void;
}

const PREDEFINED_GOALS = [
  { id: 'code', label: 'Coding', icon: 'code-slash', placeholder: 'z.B. Auth-Bug in Zeile 40 fixen...' },
  { id: 'learn', label: 'Lernen', icon: 'book', placeholder: 'z.B. Kapitel 4: Synapsen zusammenfassen...' },
  { id: 'orga', label: 'Orga / E-Mails', icon: 'mail-unread', placeholder: 'z.B. Inbox Zero erreichen...' },
  { id: 'deep', label: 'Deep Work', icon: 'flash', placeholder: 'z.B. Konzept für neues Projekt schreiben...' },
];

export default function GateIntention({ onNext, onCancel }: GateIntentionProps) {
  const [brainDump, setBrainDump] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [specificTask, setSpecificTask] = useState('');

  const [step, setStep] = useState<1 | 2>(1);

  const nextStep = (next: 1 | 2) => {
    Keyboard.dismiss();
    setStep(next);
  };

  const submitIntention = () => {
    const finalGoal = `[${selectedCategory}] ${specificTask}`;
    onNext(finalGoal, brainDump);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 w-full"
    >
      {/* SCROLLVIEW:
        Hier ist nur noch der Inhalt drin (Header, Texte, Eingabefelder).
        Die Buttons wurden herausgenommen!
      */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: 100, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="flex-1 w-full"
      >
        <View className="flex-1 w-full">

          {/* HEADER */}
          <View className="flex-row justify-between items-start mb-12">
            <View>
              <Text className="text-gray-500 text-xs font-bold tracking-[2px] uppercase mb-1">
                Phase 1 • Step {step}
              </Text>
              <Text className="text-white text-3xl font-bold">
                {step === 1 ? 'Clear Mind' : 'Mission Objective'}
              </Text>
            </View>
            <TouchableOpacity onPress={onCancel} className="bg-[#111] p-2 rounded-full border border-gray-800">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* CONTAINER FÜR DEN INHALT */}
          <View className="flex-1 w-full mt-4">

            {/* =========================================
                SCHRITT 1: BRAIN DUMP CONTENT
                ========================================= */}
            {step === 1 && (
              <View className="w-full flex-1">
                <Text className="text-gray-400 text-sm text-center mb-6 leading-6 font-medium">
                  Leere deinen Arbeitsspeicher. Notiere alles, was dich ablenkt. Wir sperren es weg.
                </Text>

                <View className="bg-[#111] border border-gray-800 rounded-3xl shadow-sm shadow-white/5 overflow-hidden w-full mb-8">
                  <TextInput
                    className="text-white text-base p-6"
                    placeholder="Paket abholen, E-Mail an Chef..."
                    placeholderTextColor="#4b5563"
                    value={brainDump}
                    onChangeText={setBrainDump}
                    multiline={true}
                    autoFocus={true}
                    style={{ minHeight: 180, textAlignVertical: 'top' }}
                  />
                </View>
              </View>
            )}

            {/* =========================================
                SCHRITT 2: DAS ZIEL CONTENT
                ========================================= */}
            {step === 2 && (
              <View className="w-full flex-1">
                <Text className="text-gray-400 text-sm text-center mb-6 leading-6 font-medium">
                  Wähle deinen Bereich und definiere den exakten ersten Schritt.
                </Text>

                {/* Kategorie-Auswahl (Die 4 Buttons) */}
                <View className="flex-row flex-wrap justify-between gap-y-4 mb-8 w-full">
                  {PREDEFINED_GOALS.map((item) => {
                    const isSelected = selectedCategory === item.label;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setSelectedCategory(item.label)}
                        className={`w-[48%] border p-4 rounded-3xl items-center flex-row justify-center transition-all ${isSelected ? 'bg-green-900/30 border-green-500' : 'bg-[#111] border-gray-800 active:bg-[#222]'
                          }`}
                      >
                        <Ionicons name={item.icon as any} size={20} color={isSelected ? "#22c55e" : "#9ca3af"} style={{ marginRight: 8 }} />
                        <Text className={`font-bold text-sm ${isSelected ? 'text-green-400' : 'text-white'}`}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Spezifische Aufgabe */}
                {selectedCategory && (
                  <View className="bg-[#111] border border-gray-800 rounded-3xl overflow-hidden mb-8 w-full">
                    <View className="bg-gray-900/50 px-4 py-3 border-b border-gray-800">
                      <Text className="text-gray-500 text-[10px] font-bold tracking-[2px] uppercase">
                        Spezifischer Fokus
                      </Text>
                    </View>
                    <TextInput
                      className="text-white text-base p-4"
                      placeholder={PREDEFINED_GOALS.find(g => g.label === selectedCategory)?.placeholder}
                      placeholderTextColor="#4b5563"
                      value={specificTask}
                      onChangeText={setSpecificTask}
                      autoFocus={true}
                      returnKeyType="done"
                      onSubmitEditing={submitIntention}
                      style={{ minHeight: 80, textAlignVertical: 'top' }}
                    />
                  </View>
                )}
              </View>
            )}

          </View>
        </View>
      </ScrollView>

      {/* STICKY FOOTER:
        Dieser Bereich liegt außerhalb der ScrollView.
        Die Buttons bleiben IMMER ganz unten stehen, auch wenn die Tastatur hochkommt.
      */}
      <View className="w-full pb-8 pt-4">
        {step === 1 ? (
          <TouchableOpacity
            onPress={() => nextStep(2)}
            className={`transition-all w-full py-4 rounded-2xl items-center border-[1px] ${brainDump.trim().length > 0
              ? 'bg-white border-white shadow-lg shadow-white/20'
              : 'bg-transparent border-gray-700'
              }`}
          >
            <Text className={`font-bold tracking-widest text-sm uppercase ${brainDump.trim().length > 0 ? 'text-black' : 'text-gray-400'}`}>
              {brainDump.trim().length > 0 ? 'Wegsperren & Weiter' : 'Überspringen'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={submitIntention}
            disabled={!(selectedCategory && specificTask.trim().length > 0)}
            className={`transition-all w-full py-4 rounded-2xl items-center border-[1px] ${selectedCategory && specificTask.trim().length > 0
              ? 'bg-white border-white shadow-lg shadow-white/20'
              : 'bg-transparent border-gray-700'
              }`}
          >
            <Text className={`font-bold tracking-widest text-sm uppercase ${selectedCategory && specificTask.trim().length > 0 ? 'text-black' : 'text-gray-400'}`}>
              {selectedCategory && specificTask.trim().length > 0 ? 'Commit & Continue' : 'Wähle Kategorie & Fokus'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </KeyboardAvoidingView>
  );
}