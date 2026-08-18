import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { TripProvider } from './src/state/TripContext';
import { initializeAds } from './src/ads/AdMobManager';

export default function App() {
  useEffect(() => {
    initializeAds();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TripProvider>
        <RootNavigator />
      </TripProvider>
    </GestureHandlerRootView>
  );
}
