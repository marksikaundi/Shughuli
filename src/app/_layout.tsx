import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { AppLockShell } from '@/components/app-lock-shell';
import { ForceUpdateGate } from '@/components/force-update-gate';
import { Palette } from '@/constants/palette';
import { useCopy } from '@/lib/settings-copy';
import { syncAllTasks } from '@/lib/google-calendar';
import { syncPlannedReminders } from '@/lib/planned-reminders';
import { usePreferencesStore } from '@/store/preferences';
import { useProjectStore } from '@/store/projects';
import { useSectionStore } from '@/store/sections';
import { useTaskStore } from '@/store/tasks';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const ready = useTaskStore((state) => state.ready);
  const projectsReady = useProjectStore((state) => state.ready);
  const sectionsReady = useSectionStore((state) => state.ready);
  const prefsReady = usePreferencesStore((state) => state.ready);
  const error = useTaskStore((state) => state.error);
  const reduceMotion = usePreferencesStore((state) => state.prefs.reduceMotion);
  const text = useCopy();

  useEffect(() => {
    Promise.all([
      useTaskStore.getState().hydrate().then(() => Promise.all([useProjectStore.getState().hydrate(), useSectionStore.getState().hydrate()])),
      usePreferencesStore.getState().hydrate(),
    ])
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
      {!ready || !projectsReady || !sectionsReady || !prefsReady ? null : error ? (
        <View style={styles.error}>
          <Text style={styles.errorTitle}>{text.couldNotOpenTasks}</Text>
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
                presentation: 'transparentModal',
                animation: reduceMotion ? 'none' : 'fade',
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
            <Stack.Screen
              name="add-project"
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
