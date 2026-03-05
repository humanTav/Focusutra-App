import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, LayoutAnimation, Platform, UIManager, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getChecklistItems, getChecklistEnabled } from '../store/storage';

// Aktiviert LayoutAnimation auf Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  onNext: () => void;
  onCancel: () => void;
}

export default function GateChecklist({ onNext, onCancel }: Props) {
  const [activeItems, setActiveItems] = useState<any[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const isEnabled = await getChecklistEnabled();
      const items = await getChecklistItems();
      const enabledItems = items.filter((item: any) => item.selected === true);

      if (!isEnabled || enabledItems.length === 0) {
        onNext();
        return;
      }
      setActiveItems(enabledItems);
      setLoading(false);
    };
    loadData();
  }, []);

  const toggleCheck = (id: string) => {
    Haptics.selectionAsync(); // Haptisches Feedback für "Klick"

    // Layout Animation für flüssige Übergänge
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const newChecked = new Set(checkedIds);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedIds(newChecked);
  };

  const allChecked = activeItems.length > 0 && activeItems.every(item => checkedIds.has(item.id));

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 w-full"
    >
      <ScrollView
        // HIER GEÄNDERT: paddingTop von 60 auf 100 für mehr Luft nach oben (1:1 wie GateIntention)
        contentContainerStyle={{ flexGrow: 1, paddingTop: 100, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HIER WURDE px-6 ENTFERNT! Keine doppelten Ränder mehr! */}
        <View className="flex-1 w-full">

          {/* HEADER */}
          <View className="flex-row justify-between items-start mb-12">
            <View>
              <Text className="text-gray-500 text-xs font-bold tracking-[2px] uppercase mb-1">
                Phase 1 • Step 3
              </Text>
              <Text className="text-white text-3xl font-bold">
                Prep Check
              </Text>
            </View>
            <TouchableOpacity onPress={onCancel} className="bg-[#111] p-2 rounded-full border border-gray-800">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* CONTAINER FÜR DEN INHALT */}
          <View className="flex-1 w-full mt-4">

            <Text className="text-gray-400 text-sm text-center mb-6 leading-6 font-medium">
              Stelle sicher, dass alle physiologischen Bedingungen für tiefen Fokus erfüllt sind.
            </Text>

            {/* LISTE - Jetzt als saubere Spalte */}
            <View className="w-full gap-y-4">
              {activeItems.map((item) => {
                const isChecked = checkedIds.has(item.id);

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleCheck(item.id)}
                    activeOpacity={0.8}
                    // Wichtig: border-[1px] genutzt, damit es nicht springt
                    className={`w-full flex-row items-center justify-between p-5 rounded-3xl border-[1px] transition-all active:bg-[#222] ${isChecked
                        ? 'bg-[#111] border-green-900/50 opacity-50' // Erledigt = Dunkler & Dezent
                        : 'bg-[#111] border-gray-800'                // Offen = Heller
                      }`}
                  >
                    <Text className={`text-base font-bold tracking-wide ${isChecked ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {item.text}
                    </Text>

                    {/* Custom Checkbox */}
                    <View className={`w-6 h-6 rounded-full border-[1.5px] items-center justify-center ml-4 ${isChecked ? 'bg-green-500 border-green-500' : 'border-gray-600 bg-transparent'
                      }`}>
                      {isChecked && <Ionicons name="checkmark" size={14} color="black" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* FOOTER: BUTTON - Exakt das gleiche Design und Positioning wie beim Brain Dump */}
            <TouchableOpacity
              disabled={!allChecked}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onNext();
              }}
              className={`mt-auto mb-4 transition-all w-full py-4 rounded-2xl items-center border-[1px] ${allChecked
                  ? 'bg-white border-white shadow-lg shadow-white/20'
                  : 'bg-transparent border-gray-700'
                }`}
            >
              <Text className={`font-bold tracking-widest text-sm uppercase ${allChecked ? 'text-black' : 'text-gray-400'}`}>
                Confirm & Continue
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}