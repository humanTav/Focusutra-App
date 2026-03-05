# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (opens Expo Go QR code)
npm start

# Platform-specific launchers
npm run android
npm run ios
npm run web
```

There is no test runner or linter configured. TypeScript checking is via `tsc --noEmit` (tsconfig.json is present).

## Architecture

This is a **React Native / Expo** app (SDK 54, New Architecture enabled) called "Focusutra". It is a focus/productivity timer app that uses the phone's accelerometer to enforce face-down usage.

### Navigation flow (App.tsx)

```
HomeScreen → GateScreen → FocusScreen → SuccessScreen
                                      → TimeoutScreen (post-session decompression)
HomeScreen → BuilderScreen (session configuration)
```

`NavigationContainer` uses a custom black theme throughout to prevent white flash artifacts during transitions. All screens use `headerShown: false`.

### Screen responsibilities

- **HomeScreen** – Dashboard with calendar heatmap, streak counter, and stats. Reads config to decide whether to route to Gate or directly to Focus when starting.
- **GateScreen** – Multi-step pre-session ritual wizard. Steps: Intention (1) → Checklist (2, optional) → StateCheck (3) → Breathing (4, optional) → Anchor (5). Steps are skipped based on user config and selected mental state.
- **FocusScreen** – The core timer. Uses `expo-sensors` Accelerometer to detect face-down (z > 0.9). Timer only counts while device is face-down. Lifting the device starts a 5-second penalty countdown before failing the session. Plays looping audio via `expo-av`. Screen stays awake via `expo-keep-awake`.
- **BuilderScreen** – Settings screen for configuring the 4 ritual steps (checklist items, breathing method, background sound, timeout activities). Uses bottom-sheet modals.
- **SuccessScreen / TimeoutScreen** – Post-session screens.

### State & storage (src/store/storage.ts)

All persistence is via `@react-native-async-storage/async-storage`. No global state manager (no Redux/Zustand). Each screen loads its own data on mount using `useFocusEffect` for re-loading when navigating back.

Storage keys use feature-specific prefixes (`focusutra_*`). All reads use a generic `getData<T>(key, default)` helper with JSON parse fallback. Batch writes use `AsyncStorage.multiSet`.

### Styling

NativeWind v2 (Tailwind for React Native) via `className` props. Babel plugins: `nativewind/babel` and `react-native-reanimated/plugin` (reanimated must be last). The design is dark-first: black background (`#000`), dark cards (`#111`), gray borders (`gray-800`). When inline `style` props are mixed with `className`, inline styles take precedence as usual in RN.

### Audio assets

Sound files live in `assets/sounds/` (brownnoise.mp3, rain.mp3, binauralbeats.mp3). They are referenced via `require()` in FocusScreen's `SOUND_MAP`. Adding a new sound requires both adding the file and adding entries to `SOUND_MAP` and `SOUND_TITLES`.

### Types (src/types/index.ts)

- `UserState`: `'lethargic' | 'stressed' | 'ready' | 'skip' | null` — drives which breathing exercise is shown in GateBreathing.
- `ChecklistItem`: `{ id, text, selected }` — used for both pre-session checklist and post-session timeout activities.
- `Stats`: `{ totalMinutes, sessions }`.
