import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { AppLockShell } from '@/components/app-lock-shell';
import { ForceUpdateGate } from '@/components/force-update-gate';
import { Palette } from '@/constants/palette';
import { syncAllTasks } from '@/lib/google-calendar';
import { syncPlannedReminders } from '@/lib/planned-reminders';
import { usePreferencesStore } from '@/store/preferences';
import { useTaskStore } from '@/store/tasks';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const ready = useTaskStore((state) => state.ready);
  const prefsReady = usePreferencesStore((state) => state.ready);
  const error = useTaskStore((state) => state.error);
  const reduceMotion = usePreferencesStore((state) => state.prefs.reduceMotion);

  useEffect(() => {
    Promise.all([useTaskStore.getState().hydrate(), usePreferencesStore.getState().hydrate()])
      .then(async () => {
        if (useTaskStore.getState().error) return;
        await useTaskStore.getState().syncReminders();
        await syncPlannedReminders(usePreferencesStore.getState().prefs);
        await syncAllTasks(useTaskStore.getState().tasks);
      })
      .finally(() => {
        SplashScreen.hideAsync();
      });
  }, []);

  return (
    <View style={styles.root}>
      {!ready || !prefsReady ? null : error ? (
        <View style={styles.error}>
          <Text style={styles.errorTitle}>Couldn’t open your tasks</Text>
          <Text style={styles.errorBody}>{error}</Text>
        </View>
      ) : (
        <AppLockShell>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: reduceMotion ? 'none' : 'default',
              contentStyle: { backgroundColor: '#FBF6F3' },
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="add-task"
              options={{
                presentation: 'modal',
                animation: reduceMotion ? 'none' : 'slide_from_bottom',
              }}
            />
          </Stack>
        </AppLockShell>
      )}
      <ForceUpdateGate />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FBF6F3',
  },
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
