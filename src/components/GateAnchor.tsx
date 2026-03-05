import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    onNext: () => void;
    onSkip: () => void;
}

export default function GateAnchor({ onNext, onSkip }: Props) {
    const [anchorSecondsLeft, setAnchorSecondsLeft] = useState(30);
    const dotScale = useRef(new Animated.Value(1)).current;
    const textOpacity = useRef(new Animated.Value(1)).current;
    const isFinished = useRef(false);

    // 1. ANIMATION & TIMER RUNTERZÄHLEN
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(dotScale, { toValue: 1.5, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(dotScale, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        const interval = setInterval(() => {
            setAnchorSecondsLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(interval);
            dotScale.stopAnimation();
        };
    }, [dotScale]);

    // 2. BEOBACHTER
    useEffect(() => {
        if (anchorSecondsLeft === 27) {
            Animated.timing(textOpacity, {
                toValue: 0,
                duration: 1500,
                useNativeDriver: true,
            }).start();
        }

        if (anchorSecondsLeft === 0 && !isFinished.current) {
            isFinished.current = true;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            dotScale.stopAnimation();
            onNext();
        }
    }, [anchorSecondsLeft, textOpacity, dotScale, onNext]);

    return (
        <View className="flex-1 w-full pt-[100px] pb-10">

            {/* HEADER */}
            <View className="flex-row justify-between items-start mb-12">
                <Animated.View style={{ opacity: textOpacity }}>
                    <Text className="text-gray-500 text-xs font-bold tracking-[2px] uppercase mb-1">
                        Phase 2 • Step 2
                    </Text>
                    <Text className="text-white text-3xl font-bold">
                        Visual Anchor
                    </Text>
                </Animated.View>
                <TouchableOpacity onPress={onSkip} className="bg-[#111] p-2 rounded-full border border-gray-800">
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* CONTENT */}
            <View className="flex-1 w-full mt-4">

                <Animated.View style={{ opacity: textOpacity }}>
                    <Text className="text-gray-400 text-sm text-center mb-6 leading-6 font-medium">
                        Bitte starre für 30 Sekunden auf den Punkt in der Mitte. Dies fokussiert deinen Geist und bereitet den Flow-State vor.
                    </Text>
                </Animated.View>

                {/* ANCHOR ANIMATION */}
                {/* HIER GEÄNDERT: -mt-32 zieht den Punkt optisch perfekt in die Mitte */}
                <View className="flex-1 items-center justify-center -mt-32">
                    <Animated.View
                        style={{
                            width: 12,
                            height: 12,
                            backgroundColor: 'white',
                            borderRadius: 6,
                            transform: [{ scale: dotScale }],
                        }}
                    />
                </View>

                {/* FOOTER COUNTDOWN */}
                <View className="w-full items-center mt-auto mb-4">
                    <Text className="text-gray-800 text-xs font-bold tracking-[8px] uppercase">
                        {anchorSecondsLeft}
                    </Text>
                </View>

            </View>
        </View>
    );
}