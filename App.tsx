import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PackingScreen } from './src/screens/PackingScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PackingScreen />
    </GestureHandlerRootView>
  );
}
