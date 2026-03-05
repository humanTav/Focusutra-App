import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getStats, getHistory, getStartDate, formatMinutesToHours, getDateKey,
  getChecklistEnabled, getChecklistItems, getBreathingEnabled
} from '../store/storage';

// --- STREAK HELPER ---
const calculateStreaks = (history: Record<string, number>) => {
  const dates = Object.keys(history).sort();
  if (dates.length === 0) return { current: 0, longest: 0 };

  let current = 0;
  const today = new Date();
  const todayKey = getDateKey(today);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);

  let checkDate = (history[todayKey] > 0) ? today : yesterday;

  if (!history[todayKey] && !history[yesterdayKey]) {
    current = 0;
  } else {
    while (true) {
      const key = getDateKey(checkDate);
      if (history[key] && history[key] > 0) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  let longest = Math.max(current, 0);
  return { current, longest };
};

export default function HomeScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const [stats, setStats] = useState({ totalMinutes: 0, sessions: 0 });
  const [history, setHistory] = useState<any>({});
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [streaks, setStreaks] = useState({ current: 0, longest: 0 });

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [nextRoute, setNextRoute] = useState('Gate');

  const loadData = useCallback(async () => {
    const s = await getStats();
    const h = (await getHistory()) as Record<string, number>;
    const startStr = await getStartDate();

    setStats(s);
    setHistory(h);
    setStreaks(calculateStreaks(h));

    if (startStr) {
      setStartDate(new Date(startStr));
    } else {
      setStartDate(new Date());
    }

    const checkEnabled = await getChecklistEnabled();
    const checkItems = await getChecklistItems();
    const breathEnabled = await getBreathingEnabled();

    if (!(checkEnabled && checkItems.some((i: any) => i.selected)) && !breathEnabled) {
      setNextRoute('Focus');
    } else {
      setNextRoute('Gate');
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // --- NAVIGATION ---
  const isPrevDisabled = useCallback(() => {
    if (!startDate) return false;
    return viewDate.getFullYear() === startDate.getFullYear() && viewDate.getMonth() === startDate.getMonth();
  }, [startDate, viewDate]);

  const isNextDisabled = useCallback(() => {
    const today = new Date();
    return viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
  }, [viewDate]);

  const prevMonth = useCallback(() => {
    if (isPrevDisabled()) return;
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setViewDate(newDate);
  }, [viewDate, isPrevDisabled]);

  const nextMonth = useCallback(() => {
    if (isNextDisabled()) return;
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setViewDate(newDate);
  }, [viewDate, isNextDisabled]);

  // --- CALENDAR LOGIC ---
  const getDaysGrid = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let firstDayOfWeek = new Date(year, month, 1).getDay();
    let offset = (firstDayOfWeek + 6) % 7;

    const cells: any[] = [];

    for (let i = 0; i < offset; i++) {
      cells.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateKey = getDateKey(d);
      const minutes = history[dateKey] ?? 0;
      cells.push({ day: i, minutes, dateKey });
    }

    while (cells.length < 42) {
      cells.push(null);
    }

    return cells;
  };

  const getBackgroundColor = (minutes: number): string => {
    if (minutes === 0) return "rgba(255, 255, 255, 0.05)";
    if (minutes < 30) return "#064e3b";
    if (minutes < 60) return "#10b981";
    if (minutes < 90) return "#34d399";
    return "#4ade80";
  };

  const formatDayLabel = (dateKey: string): string => {
    const [y, m, d] = dateKey.split('-').map(Number);
    return `${d}. ${monthNames[m - 1]} ${y}`;
  };

  const openDayModal = (dayItem: any) => {
    if (!dayItem) return;
    setSelectedDay(dayItem);
    setModalVisible(true);
  };
  const closeDayModal = () => setModalVisible(false);

  const daysGrid = getDaysGrid();

  // --- DYNAMIC TILE SIZE ---
  const SCREEN_PADDING = 48; // px-6 = 24px * 2
  const CARD_PADDING = 40;   // p-5 = 20px * 2
  const GAP = 4;

  const availableWidth = width - SCREEN_PADDING - CARD_PADDING;
  const calculatedTileSize = Math.floor((availableWidth - GAP * 6) / 7);
  const tileSize = Math.min(calculatedTileSize, 42);
  const tileGap = GAP;

  return (
    <View className="flex-1 bg-black px-6 pt-20 pb-10 justify-between">

      {/* OBERER BEREICH */}
      <View className="w-full">
        {/* 1. Header */}
        <View className="flex-row justify-between items-end mb-6">
          <View>
            <Text className="text-gray-500 text-xs font-bold tracking-[2px] uppercase mb-1">Focusutra</Text>
            <Text className="text-white text-4xl font-bold tracking-tighter">Dashboard</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* 2. Edit Session */}
        <View className="mb-5">
          <TouchableOpacity
            onPress={() => navigation.navigate('Builder')}
            className="bg-[#111] p-4 rounded-2xl border border-gray-800 w-full flex-row justify-between items-center active:bg-gray-800"
          >
            <View>
              <Text className="text-white font-bold text-lg">Edit Session</Text>
              <Text className="text-gray-500 text-xs">Configure Rituals & Timer</Text>
            </View>
            <Ionicons name="options-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* 3. BIG DASHBOARD CARD */}
        <View className="bg-[#111] p-5 rounded-3xl border border-gray-800">

          {/* TOP ROW: Month + Streak */}
          <View className="flex-row justify-between items-start mb-5">
            <View>
              <View className="flex-row items-center mb-1">
                {/* FIX: minWidth zwingt das Textfeld immer exakt gleich breit zu sein, egal welcher Monat */}
                <Text className="text-white font-bold text-3xl" style={{ minWidth: 170 }}>
                  {monthNames[viewDate.getMonth()]}
                </Text>
                <View className="flex-row items-center pt-1">
                  <TouchableOpacity onPress={prevMonth} disabled={isPrevDisabled()} className="px-1">
                    <Ionicons name="chevron-back" size={18} color={isPrevDisabled() ? '#333' : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={nextMonth} disabled={isNextDisabled()} className="px-1">
                    <Ionicons name="chevron-forward" size={18} color={isNextDisabled() ? '#333' : '#666'} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text className="text-gray-500 font-bold text-sm ml-1">
                {viewDate.getFullYear()}
              </Text>
            </View>

            <View className="items-end">
              <View className="flex-row items-center">
                <Text className="text-white text-xl font-bold mr-1">{streaks.current}</Text>
                <Ionicons name="flame" size={20} color="#ef4444" />
              </View>
              <Text className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">Streak</Text>
            </View>
          </View>

          {/* WEEKDAYS HEADER */}
          <View style={{ flexDirection: 'row', marginBottom: 6 }}>
            {weekDays.map((day, index) => (
              <View
                key={index}
                style={{
                  width: tileSize,
                  marginRight: index < 6 ? tileGap : 0,
                  alignItems: 'center',
                }}
              >
                <Text className="text-gray-500 text-[9px] font-bold uppercase">
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* CALENDAR GRID */}
          <View style={{ marginBottom: 12 }}>
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <View
                key={`row-${rowIndex}`}
                style={{ flexDirection: 'row', marginBottom: rowIndex < 5 ? tileGap : 0 }}
              >
                {Array.from({ length: 7 }).map((_, colIndex) => {
                  const cellIndex = rowIndex * 7 + colIndex;
                  const dayItem = daysGrid[cellIndex];

                  if (!dayItem) {
                    return (
                      <View
                        key={`empty-${cellIndex}`}
                        style={{
                          width: tileSize,
                          height: tileSize,
                          marginRight: colIndex < 6 ? tileGap : 0,
                          borderRadius: 4,
                          backgroundColor: 'transparent',
                        }}
                      />
                    );
                  }

                  const isSelected = selectedDay?.dateKey === dayItem.dateKey && modalVisible;
                  return (
                    <TouchableOpacity
                      key={dayItem.dateKey}
                      onPress={() => openDayModal(dayItem)}
                      activeOpacity={0.7}
                      style={{
                        width: tileSize,
                        height: tileSize,
                        marginRight: colIndex < 6 ? tileGap : 0,
                        borderRadius: 4,
                        backgroundColor: getBackgroundColor(dayItem.minutes),
                        borderWidth: isSelected ? 1 : 0,
                        borderColor: isSelected ? 'white' : 'transparent',
                      }}
                    />
                  );
                })}
              </View>
            ))}
          </View>

          {/* STATS FOOTER */}
          <View className="flex-row justify-between pt-4 border-t border-gray-800/50">
            <View>
              <Text className="text-gray-500 text-[10px] font-bold uppercase mb-1">Total Hours</Text>
              <Text className="text-white text-base font-bold">{formatMinutesToHours(stats.totalMinutes)}</Text>
            </View>
            <View>
              <Text className="text-gray-500 text-[10px] font-bold uppercase mb-1">Sessions</Text>
              <Text className="text-white text-base font-bold">{stats.sessions}</Text>
            </View>
            <View>
              <Text className="text-gray-500 text-[10px] font-bold uppercase mb-1">Best Streak</Text>
              <Text className="text-white text-base font-bold">{streaks.longest}</Text>
            </View>
          </View>

        </View>
      </View>

      {/* --- MODAL --- */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeDayModal}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          onPress={closeDayModal}
        >
          <Pressable
            onPress={() => { }}
            className="bg-[#111] rounded-3xl border border-gray-800 items-center"
            style={{ paddingVertical: 24, paddingHorizontal: 28, minWidth: 260 }}
          >
            <View className="w-10 h-1 bg-gray-700 rounded-full mb-5" />
            <Text className="text-gray-400 text-[11px] font-bold tracking-[2px] uppercase mb-1.5">Datum</Text>
            <Text className="text-white text-xl font-bold mb-4">
              {selectedDay ? formatDayLabel(selectedDay.dateKey) : ''}
            </Text>
            <Text className="text-gray-400 text-[11px] font-bold tracking-[2px] uppercase mb-1.5">Session</Text>
            <Text className="text-green-500 text-[22px] font-extrabold">
              {selectedDay ? formatMinutesToHours(selectedDay.minutes) : '0m'}
            </Text>

            <TouchableOpacity onPress={closeDayModal} className="mt-6 bg-gray-800 py-3 px-6 rounded-2xl active:bg-gray-700">
              <Text className="text-white font-bold text-sm tracking-wider">Schließen</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 4. Start Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate(nextRoute)}
        style={{
          shadowColor: "#fff",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 5,
        }}
        className="bg-white h-16 rounded-2xl items-center flex-row justify-center active:bg-gray-200 w-full"
      >
        <Text className="text-black text-lg font-extrabold mr-2 tracking-widest">
          START FOCUS
        </Text>
        <Ionicons name="arrow-forward" size={20} color="black" />
      </TouchableOpacity>

    </View>
  );
}