import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { TripsProvider, useStore } from '@/store/trips-store';

SplashScreen.preventAutoHideAsync();

function HideSplashWhenReady() {
  const { ready } = useStore();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  return null;
}

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  const c = dark ? Colors.dark : Colors.light;
  const base = dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: c.primary, background: c.background, card: c.card, text: c.text, border: c.border },
  };

  return (
    <TripsProvider>
      <ThemeProvider value={navTheme}>
        <HideSplashWhenReady />
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerTintColor: c.text, headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="trip/new" options={{ title: 'Plan a new trip', presentation: 'modal' }} />
          <Stack.Screen name="trip/[id]" options={{ title: '' }} />
          <Stack.Screen name="trip/edit/[id]" options={{ title: 'Edit trip', presentation: 'modal' }} />
          <Stack.Screen name="place/add" options={{ title: 'Add a place', presentation: 'modal' }} />
          <Stack.Screen name="place/[placeId]" options={{ title: 'Place' }} />
          <Stack.Screen name="expense/edit" options={{ title: 'Expense', presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </TripsProvider>
  );
}
