import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { PinPad } from '@/components/settings/pin-pad';
import { Screen } from '@/components/screen';
import { useSettingsTheme } from '@/hooks/use-settings-theme';
import { biometricKind, checkPin, hasPin, unlockWithBiometrics, type BiometricKind } from '@/lib/app-lock';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export function AppLockShell({ children }: { children: ReactNode }) {
  const enabled = usePreferencesStore((state) => state.prefs.appLockEnabled);
  const useBiometrics = usePreferencesStore((state) => state.prefs.useBiometrics);
  const update = usePreferencesStore((state) => state.update);
  const [locked, setLocked] = useState(enabled);
  const leftAt = useRef<number | null>(null);
  const unlock = useCallback(() => setLocked(false), []);

  useEffect(() => {
    if (!locked) return;
    void hasPin().then((saved) => {
      if (!saved) {
        setLocked(false);
        void update({ appLockEnabled: false, useBiometrics: false });
      }
    });
  }, [locked, update]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (!usePreferencesStore.getState().prefs.appLockEnabled) return;
      if (next === 'background') {
        leftAt.current = Date.now();
        if (usePreferencesStore.getState().prefs.lockTimeout === 0) setLocked(true);
      }
      if (next !== 'active' || leftAt.current == null) return;
      const elapsed = Date.now() - leftAt.current;
      leftAt.current = null;
      const currentTimeout = usePreferencesStore.getState().prefs.lockTimeout;
      if (currentTimeout === 0 || elapsed >= currentTimeout * 60_000) setLocked(true);
    });
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.fill}>
      {children}
      {locked ? <LockScreen useBiometrics={useBiometrics} onUnlock={unlock} /> : null}
    </View>
  );
}

function LockScreen({ useBiometrics, onUnlock }: { useBiometrics: boolean; onUnlock: () => void }) {
  const theme = useSettingsTheme();
  const text = useCopy();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [kind, setKind] = useState<BiometricKind>('none');

  const tryBiometrics = useCallback(async () => {
    const unlocked = await unlockWithBiometrics();
    if (unlocked) onUnlock();
  }, [onUnlock]);

  useEffect(() => {
    void biometricKind().then(setKind);
  }, []);

  useEffect(() => {
    if (useBiometrics) void tryBiometrics();
  }, [tryBiometrics, useBiometrics]);

  const biometricLabel =
    kind === 'face' ? text.faceUnlock : kind === 'fingerprint' ? text.fingerprintUnlock : text.biometricUnlock;

  return (
    <View style={[styles.lock, { backgroundColor: theme.dark ? theme.colors.canvas : '#FBF6F3' }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Screen style={theme.dark ? { backgroundColor: theme.colors.canvas } : undefined}>
        {theme.dark ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.canvas }]} /> : null}
        <PinPad
          key={attempt}
          title={text.unlockTitle}
          subtitle={text.enterPin}
          error={error}
          onSubmit={(pin) => {
            void checkPin(pin).then((ok) => {
              if (ok) onUnlock();
              else {
                setError(text.pinMismatch);
                setAttempt((current) => current + 1);
              }
            });
          }}
          onBiometric={useBiometrics && kind !== 'none' ? () => void tryBiometrics() : undefined}
          biometricLabel={useBiometrics && kind !== 'none' ? biometricLabel : undefined}
        />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  lock: {
    ...StyleSheet.absoluteFill,
  },
});
