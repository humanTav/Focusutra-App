import React, { useState, useEffect } from 'react';
import { View } from 'react-native';

import GateIntention from '../components/GateIntention';
import GateChecklist from '../components/GateChecklist';
import GateStateCheck from '../components/GateStateCheck';
import GateBreathing from '../components/GateBreathing';
import GateAnchor from '../components/GateAnchor';

import {
  getChecklistEnabled,
  getChecklistItems,
  getBreathingEnabled,
  getAnchorEnabled,
  getAnchorDuration,
  getBrainDumpEnabled,
  getGoalEnabled,
  saveSessionIntention,
} from '../store/storage';
import { UserState } from '../types';

export default function GateScreen({ navigation }: any) {
  const [step, setStep] = useState<number | null>(null);

  // Feature flags
  const [showBrainDump, setShowBrainDump] = useState(true);
  const [showGoal, setShowGoal] = useState(true);
  const [hasChecklist, setHasChecklist] = useState(false);
  const [isBreathingEnabled, setIsBreathingEnabled] = useState(true);
  const [isAnchorEnabled, setIsAnchorEnabled] = useState(true);
  const [anchorDuration, setAnchorDuration] = useState(30);

  const [userState, setUserState] = useState<UserState>(null);

  useEffect(() => {
    const init = async () => {
      const brainDumpEnabled = await getBrainDumpEnabled();
      const goalEnabled = await getGoalEnabled();
      const checkEnabled = await getChecklistEnabled();
      const checkItems = await getChecklistItems();
      const activeChecklist = checkEnabled && checkItems.some((i: any) => i.selected);
      const breathEnabled = await getBreathingEnabled();
      const anchorEnabled = await getAnchorEnabled();
      const aDuration = await getAnchorDuration();

      setShowBrainDump(brainDumpEnabled);
      setShowGoal(goalEnabled);
      setHasChecklist(activeChecklist);
      setIsBreathingEnabled(breathEnabled);
      setIsAnchorEnabled(anchorEnabled);
      setAnchorDuration(aDuration);

      const needsIntention = brainDumpEnabled || goalEnabled;

      if (needsIntention) {
        setStep(1);
      } else if (activeChecklist) {
        setStep(2);
      } else if (breathEnabled) {
        setStep(3);
      } else if (anchorEnabled) {
        setStep(5);
      } else {
        // Nothing configured — go straight to Focus
        navigation.replace('Focus');
      }
    };

    init();
  }, []);

  // --- TRANSITION HELPERS ---

  const goToNextAfterChecklist = () => {
    if (isBreathingEnabled) {
      setStep(3);
    } else if (isAnchorEnabled) {
      setStep(5);
    } else {
      startSession();
    }
  };

  const goToNextAfterStateCheck = (state: UserState) => {
    if (state === 'skip' || !isBreathingEnabled) {
      if (isAnchorEnabled) {
        setStep(5);
      } else {
        startSession();
      }
    } else {
      setStep(4);
    }
  };

  const goToNextAfterBreathing = () => {
    if (isAnchorEnabled) {
      setStep(5);
    } else {
      startSession();
    }
  };

  // --- STEP HANDLERS ---

  const handleIntentionDone = async (goal: string, brainDump: string) => {
    await saveSessionIntention(goal, brainDump);
    if (hasChecklist) {
      setStep(2);
    } else if (isBreathingEnabled) {
      setStep(3);
    } else if (isAnchorEnabled) {
      setStep(5);
    } else {
      startSession();
    }
  };

  const handleChecklistDone = () => goToNextAfterChecklist();

  const handleStateCheckDone = (selectedState: UserState) => {
    setUserState(selectedState);
    goToNextAfterStateCheck(selectedState);
  };

  const handleBreathingDone = () => goToNextAfterBreathing();

  const startSession = () => {
    navigation.replace('Focus');
  };

  if (step === null) return <View className="flex-1 bg-black" />;

  return (
    <View className="flex-1 bg-black px-6">

      {step === 1 && (
        <GateIntention
          onNext={handleIntentionDone}
          onCancel={() => navigation.goBack()}
          showBrainDump={showBrainDump}
          showGoal={showGoal}
        />
      )}

      {step === 2 && (
        <GateChecklist
          onNext={handleChecklistDone}
          onCancel={() => navigation.goBack()}
        />
      )}

      {step === 3 && (
        <GateStateCheck
          onNext={handleStateCheckDone}
          onCancel={() => navigation.goBack()}
        />
      )}

      {step === 4 && (
        <GateBreathing
          onNext={handleBreathingDone}
          onSkip={handleBreathingDone}
          userState={userState}
        />
      )}

      {step === 5 && (
        <GateAnchor
          onNext={startSession}
          onSkip={startSession}
          duration={anchorDuration}
        />
      )}

    </View>
  );
}
