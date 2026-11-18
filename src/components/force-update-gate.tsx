import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/screen';
import { Palette } from '@/constants/palette';
import {
  isPlayStoreNotification,
  notifyPlayUpdate,
  openPlayStore,
  playUpdatesSupported,
  readPlayUpdate,
  startImmediateUpdate,
  watchUpdateCancelled,
} from '@/lib/play-update';

export function ForceUpdateGate() {
  const insets = useSafeAreaInsets();
  const [required, setRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const checking = useRef(false);
  const prompted = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!playUpdatesSupported() || checking.current) return;
    checking.current = true;
    try {
      const update = await readPlayUpdate();
      if (!update.updateAvailable) {
        setRequired(false);
        return;
      }

      const key = update.storeVersion ?? 'available';
      setRequired(true);
      await notifyPlayUpdate(update.storeVersion);

      if (update.updateInProgress || prompted.current !== key) {
        prompted.current = key;
        if (update.immediateAllowed || update.updateInProgress) {
          await startImmediateUpdate();
        }
      }
    } catch {
      // Play can only report an update for a build installed from the Play Store.
    } finally {
      checking.current = false;
    }
  }, []);

  useEffect(() => {
    if (!playUpdatesSupported()) return;

    const unsubscribe = watchUpdateCancelled(() => setRequired(true));
    const responses = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (!isPlayStoreNotification(data, response.actionIdentifier)) return;
      void openPlayStore();
    });
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh();
    });
    const initialCheck = setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      clearTimeout(initialCheck);
      unsubscribe();
      responses.remove();
      appState.remove();
    };
  }, [refresh]);

  useEffect(() => {
    if (!required) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => back.remove();
  }, [required]);

  const updateNow = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const started = await startImmediateUpdate();
      if (!started) await openPlayStore();
    } catch {
      await openPlayStore();
    } finally {
      setBusy(false);
    }
  }, [busy]);

  if (!required) return null;

  return (
    <View style={styles.overlay}>
      <StatusBar style="dark" />
      <Screen>
        <View style={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 28 }]}>
          <Text style={styles.kicker}>Google Play</Text>
          <Text style={styles.title}>Update required</Text>
          <Text style={styles.body}>
            A new version of Shughuli is on the Play Store. Update to keep using the app.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Update now"
            disabled={busy}
            onPress={() => void updateNow()}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed, busy && styles.disabled]}>
            <Text style={styles.primaryLabel}>{busy ? 'Opening update…' : 'Update now'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Play Store"
            disabled={busy}
            onPress={() => void openPlayStore()}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.secondaryLabel}>Open Play Store</Text>
          </Pressable>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    backgroundColor: Palette.wash,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
  },
  kicker: {
    color: Palette.limeDeep,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 10,
    color: Palette.ink,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: 700,
    letterSpacing: -1.2,
  },
  body: {
    marginTop: 14,
    color: Palette.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  primary: {
    marginTop: 28,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: 700,
  },
  secondary: {
    marginTop: 12,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.7,
  },
});
