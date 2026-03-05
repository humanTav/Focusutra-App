import React, { useState, useEffect } from 'react';
import { View } from 'react-native';

// Components
import GateIntention from '../components/GateIntention';
import GateChecklist from '../components/GateChecklist';
import GateStateCheck from '../components/GateStateCheck';
import GateBreathing from '../components/GateBreathing';
import GateAnchor from '../components/GateAnchor';

// Storage Functions
import {
  getChecklistEnabled,
  getChecklistItems,
  getBreathingEnabled,
  saveSessionIntention
} from '../store/storage';
import { UserState } from '../types';

export default function GateScreen({ navigation }: any) {
  const [step, setStep] = useState<number | null>(null);

  // Status-Variablen für das Routing
  const [hasChecklist, setHasChecklist] = useState(false);
  const [isBreathingEnabled, setIsBreathingEnabled] = useState(true);
  const [userState, setUserState] = useState<UserState>(null);

  // 1. BEIM START: Konfiguration lesen
  useEffect(() => {
    const init = async () => {
      const checkEnabled = await getChecklistEnabled();
      const checkItems = await getChecklistItems();
      const activeChecklist = checkEnabled && checkItems.some((i: any) => i.selected);

      const breathEnabled = await getBreathingEnabled();

      setHasChecklist(activeChecklist);
      setIsBreathingEnabled(breathEnabled);

      // Start always with Phase 1 Concept (Brain Dump + Intention)
      setStep(1);
    };

    init();
  }, []);

  // --- ÜBERGANGS LOGIK ---

  // Von Step 1 (Intention) -> Checklist oder StateCheck
  const handleIntentionDone = async (goal: string, brainDump: string) => {
    // Daten speichern
    await saveSessionIntention(goal, brainDump);

    if (hasChecklist) {
      setStep(2); // Checkliste
    } else {
      setStep(3); // StateCheck
    }
  };

  // Von Step 2 (Checklist) -> StateCheck
  const handleChecklistDone = () => {
    setStep(3);
  };

  // Von Step 3 (StateCheck) -> Breathing oder Anchor
  const handleStateCheckDone = (selectedState: UserState) => {
    setUserState(selectedState);
    if (selectedState === 'skip' || !isBreathingEnabled) {
      setStep(5); // Anchor
    } else {
      setStep(4); // Breathing
    }
  };

  // Von Step 4 (Breathing) -> Anchor
  const handleBreathingDone = () => {
    setStep(5);
  };

  // Von Step 5 (Anchor) -> Focus
  const startSession = () => {
    navigation.replace('Focus');
  };

  if (step === null) return <View className="flex-1 bg-black" />;

  return (
    <View className="flex-1 bg-black px-6">

      {/* SCHRITT 1: INTENTION (Phase 1) */}
      {step === 1 && (
        <GateIntention
          onNext={handleIntentionDone}
          onCancel={() => navigation.goBack()}
        />
      )}

      {/* SCHRITT 2: CHECKLISTE (Phase 1) */}
      {step === 2 && (
        <GateChecklist
          onNext={handleChecklistDone}
          onCancel={() => navigation.goBack()}
        />
      )}

      {/* SCHRITT 3: STATE CHECK (Phase 2) */}
      {step === 3 && (
        <GateStateCheck
          onNext={handleStateCheckDone}
          onCancel={() => navigation.goBack()}
        />
      )}

      {/* SCHRITT 4: ATMUNG (Phase 2) */}
      {step === 4 && (
        <GateBreathing
          onNext={handleBreathingDone}
          onSkip={handleBreathingDone}
          userState={userState}
        />
      )}

      {/* SCHRITT 5: ANCHOR (Phase 2) */}
      {step === 5 && (
        <GateAnchor
          onNext={startSession}
          onSkip={startSession}
        />
      )}

    </View>
  );
}