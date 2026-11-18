import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/palette';
import { useTaskStore } from '@/store/tasks';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const ready = useTaskStore((state) => state.ready);
  const error = useTaskStore((state) => state.error);

  useEffect(() => {
    useTaskStore
      .getState()
      .hydrate()
      .finally(() => {
        SplashScreen.hideAsync();
      });
  }, []);

  if (!ready) return null;

  if (error) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorTitle}>Couldn’t open your tasks</Text>
        <Text style={styles.errorBody}>{error}</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FBF6F3' },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="add-task"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    backgroundColor: Palette.wash,
    justifyContent: 'center',
    padding: 28,
    gap: 8,
  },
  errorTitle: {
    color: Palette.ink,
    fontSize: 22,
    fontWeight: 700,
  },
  errorBody: {
    color: Palette.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
