import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, BackHandler, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function FinalScreen({ route, navigation }: any) {
  const { minutes } = route.params || { minutes: 0 };

  // Exhale animation: circle scales down and fades out, then loops
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.loop(
      Animated.sequence([
        // Exhale: shrink + fade over 5s
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.35,
            duration: 5000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.05,
            duration: 5000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Pause at bottom (1s)
        Animated.delay(1000),
        // Reset instantly (no animation)
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.35,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        // Brief pause before next exhale
        Animated.delay(800),
      ])
    ).start();

    return () => {
      backHandler.remove();
      scale.stopAnimation();
      opacity.stopAnimation();
    };
  }, [scale, opacity]);

  return (
    <View className="flex-1 bg-black px-6 pt-20 pb-10 justify-between">

      {/* TOP: Stats */}
      <View className="items-center pt-8">
        <Text className="text-gray-600 text-xs font-bold tracking-[4px] uppercase mb-3">Deep Focus</Text>
        <Text
          style={{ fontVariant: ['tabular-nums'] }}
          className="text-white text-8xl font-black tracking-tighter"
        >
          {minutes}
        </Text>
        <Text className="text-gray-600 text-xs font-bold tracking-[4px] uppercase mt-2">Minuten</Text>
      </View>

      {/* CENTER: Exhale animation */}
      <View className="flex-1 items-center justify-center">
        <Animated.View
          style={{
            width: 220,
            height: 220,
            borderRadius: 110,
            borderWidth: 1,
            borderColor: '#374151',
            backgroundColor: 'transparent',
            transform: [{ scale }],
            opacity,
          }}
        />
        <Text className="text-gray-600 text-xs font-medium tracking-[2px] text-center mt-10 absolute bottom-0">
          Atme tief aus... und lass los.
        </Text>
      </View>

      {/* BOTTOM: Title + button */}
      <View className="w-full items-center">
        <Text className="text-gray-800 text-xs font-extrabold tracking-widest uppercase mb-8">
          Shutdown Complete
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          className="w-full py-4 rounded-2xl items-center border border-gray-800 bg-transparent"
        >
          <Text className="font-bold tracking-widest text-sm uppercase text-gray-500">Zurück zur Basis</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
