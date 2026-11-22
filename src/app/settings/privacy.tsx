import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';

import { OptionSheet, SettingsRow, SettingsSection, ToggleRow } from '@/components/settings/controls';
import { PinEditor } from '@/components/settings/pin-editor';
import { SettingsPage, useSave } from '@/components/settings/page';
import type { LockTimeout } from '@/data/preferences';
import { biometricKind, hasPin } from '@/lib/app-lock';
import { clearPersonalData } from '@/lib/device-data';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function PrivacyScreen() {
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const [pinMode, setPinMode] = useState<'create' | 'change' | null>(null);
  const [armBiometrics, setArmBiometrics] = useState(false);
  const [sheet, setSheet] = useState(false);

  async function toggleLock(value: boolean) {
    if (Platform.OS === 'web') {
      Alert.alert(text.appLock, text.webLock);
      return;
    }
    if (!value) {
      await save({ appLockEnabled: false, useBiometrics: false });
      return;
    }
    if (await hasPin()) {
      await save({ appLockEnabled: true });
      return;
    }
    setArmBiometrics(false);
    setPinMode('create');
  }

  async function toggleBiometrics(value: boolean) {
    if (Platform.OS === 'web') {
      Alert.alert(text.appLock, text.webLock);
      return;
    }
    if (!value) {
      await save({ useBiometrics: false });
      return;
    }
    if ((await biometricKind()) === 'none') {
      Alert.alert(text.biometrics, text.biometricsMissing);
      return;
    }
    if (!(await hasPin())) {
      setArmBiometrics(true);
      setPinMode('create');
      return;
    }
    await save({ useBiometrics: true, appLockEnabled: true });
  }

  const timeoutLabel =
    prefs.lockTimeout === 0 ? text.immediately : prefs.lockTimeout === 5 ? text.afterFive : prefs.lockTimeout === 15 ? text.afterFifteen : text.afterMinute;

  return (
    <SettingsPage title={text.privacy}>
      <SettingsSection footer={text.hideHint}>
        <ToggleRow icon="lock" label={text.appLock} value={prefs.appLockEnabled} onChange={(value) => void toggleLock(value)} />
        <ToggleRow icon="personCircle" label={text.biometrics} value={prefs.useBiometrics} onChange={(value) => void toggleBiometrics(value)} disabled={!prefs.appLockEnabled && !prefs.useBiometrics} />
        <SettingsRow icon="clock" label={text.lockTimeout} value={timeoutLabel} onPress={() => setSheet(true)} />
        {prefs.appLockEnabled ? <SettingsRow icon="lock" label={text.changePin} onPress={() => setPinMode('change')} /> : null}
        <ToggleRow icon="eyeOff" label={text.hideSensitive} value={prefs.hideSensitive} onChange={(hideSensitive) => void save({ hideSensitive })} />
        <SettingsRow icon="shield" label={text.privacyInfo} onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })} />
        <SettingsRow icon="doc" label={text.terms} onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })} />
        <SettingsRow
          icon="trash"
          label={text.clearPersonal}
          danger
          border={false}
          onPress={() =>
            Alert.alert(text.clearPersonal, text.clearPersonalBody, [
              { text: text.cancel, style: 'cancel' },
              {
                text: text.confirm,
                style: 'destructive',
                onPress: () => {
                  void clearPersonalData()
                    .then(() => Alert.alert(text.privacy, text.personalCleared))
                    .catch(() => Alert.alert(text.privacy, text.backupFailed));
                },
              },
            ])
          }
        />
      </SettingsSection>
      <OptionSheet
        visible={sheet}
        title={text.lockTimeout}
        selected={String(prefs.lockTimeout)}
        options={[
          { id: '0', label: text.immediately },
          { id: '1', label: text.afterMinute },
          { id: '5', label: text.afterFive },
          { id: '15', label: text.afterFifteen },
        ]}
        onClose={() => setSheet(false)}
        onSelect={(id) => {
          setSheet(false);
          void save({ lockTimeout: Number(id) as LockTimeout });
        }}
      />
      <PinEditor
        visible={pinMode != null}
        mode={pinMode ?? 'create'}
        onClose={() => setPinMode(null)}
        onSaved={() => {
          setPinMode(null);
          void save({ appLockEnabled: true, useBiometrics: armBiometrics || prefs.useBiometrics });
          setArmBiometrics(false);
        }}
      />
    </SettingsPage>
  );
}
