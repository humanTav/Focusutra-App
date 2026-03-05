import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'; // DefaultTheme importieren
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Deine Screens
import HomeScreen from './src/screens/HomeScreen';
import GateScreen from './src/screens/GateScreen';
import FocusScreen from './src/screens/FocusScreen';
import SuccessScreen from './src/screens/SuccessScreen';
import BuilderScreen from './src/screens/BuildScreen';
import TimeoutScreen from './src/screens/TimeoutScreen';
import FinalScreen from './src/screens/FinalScreen';

const Stack = createNativeStackNavigator();

// --- 1. DAS THEME DEFINIEREN ---
// Das hier färbt den "Hintergrund hinter dem Hintergrund" schwarz.
const FocusTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'black', // <--- DAS LÖST DAS WEISSE BLITZEN
  },
};

export default function App() {
  return (
    // Ein schwarzer Root-View verhindert weiße Artefakte am Rand
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      {/* --- 2. THEME ÜBERGEBEN --- */}
      <NavigationContainer theme={FocusTheme}>
        <StatusBar style="light" backgroundColor="black" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            // --- 3. INHALTS-HINTERGRUND SCHWARZ MACHEN ---
            // Das garantiert, dass auch während der Animation alles schwarz bleibt
            contentStyle: { backgroundColor: 'black' },
            animation: 'slide_from_right'
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Gate" component={GateScreen} />
          <Stack.Screen name="Focus" component={FocusScreen} />
          <Stack.Screen name="Builder" component={BuilderScreen} />
          <Stack.Screen name="Success" component={SuccessScreen} />
          <Stack.Screen name="Timeout" component={TimeoutScreen} />
          <Stack.Screen name="Final" component={FinalScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}