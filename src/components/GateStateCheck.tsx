import React from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserState } from '../types';

interface Props {
    onNext: (state: UserState) => void;
    onCancel: () => void;
}

export default function GateStateCheck({ onNext, onCancel }: Props) {
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 w-full"
        >
            <ScrollView
                // HIER GEÄNDERT: paddingTop auf 100 für exakt gleiche Höhe wie die anderen Screens!
                contentContainerStyle={{ flexGrow: 1, paddingTop: 100, paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* HIER WURDE px-6 ENTFERNT, damit es sich nicht doppelt */}
                <View className="flex-1 w-full">

                    {/* HEADER */}
                    <View className="flex-row justify-between items-start mb-12">
                        <View>
                            <Text className="text-gray-500 text-xs font-bold tracking-[2px] uppercase mb-1">
                                Phase 2 • Step 1
                            </Text>
                            <Text className="text-white text-3xl font-bold">
                                Zustandsabfrage
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onCancel} className="bg-[#111] p-2 rounded-full border border-gray-800">
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* CONTENT */}
                    <View className="flex-1 w-full mt-4">
                        <Text className="text-gray-400 text-sm font-medium leading-6 mb-8 text-center">
                            Wie ist dein aktuelles Energielevel? Wir passen die Atemübung daran an.
                        </Text>

                        {/* LISTE DER ZUSTÄNDE */}
                        <View className="w-full gap-y-4">
                            <TouchableOpacity
                                onPress={() => onNext('lethargic')}
                                className="bg-[#111] border border-gray-800 p-5 rounded-3xl flex-row items-center justify-between active:bg-[#222]"
                            >
                                <View className="flex-row items-center">
                                    <Text className="text-3xl mr-4">🥱</Text>
                                    <Text className="text-white font-bold text-base tracking-wide">Müde / Lethargisch</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={24} color="#4b5563" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => onNext('stressed')}
                                className="bg-[#111] border border-gray-800 p-5 rounded-3xl flex-row items-center justify-between active:bg-[#222]"
                            >
                                <View className="flex-row items-center">
                                    <Text className="text-3xl mr-4">🌪️</Text>
                                    <Text className="text-white font-bold text-base tracking-wide">Unruhig / Gestresst</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={24} color="#4b5563" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => onNext('ready')}
                                className="bg-[#111] border border-gray-800 p-5 rounded-3xl flex-row items-center justify-between active:bg-[#222]"
                            >
                                <View className="flex-row items-center">
                                    <Text className="text-3xl mr-4">🌊</Text>
                                    <Text className="text-white font-bold text-base tracking-wide">Okay / Deep Flow</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={24} color="#4b5563" />
                            </TouchableOpacity>
                        </View>

                        {/* FOOTER BUTTON - Exakt wie bei den anderen Screens */}
                        <TouchableOpacity
                            onPress={() => onNext('skip')}
                            className="mt-auto mb-4 transition-all w-full py-4 rounded-2xl items-center border-[1px] bg-transparent border-gray-700"
                        >
                            <Text className="font-bold tracking-widest text-sm uppercase text-gray-400">
                                Überspringen
                            </Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}