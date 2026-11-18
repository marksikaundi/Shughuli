import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { ChoiceChips, OptionSheet, SettingsRow, SettingsSection, StepperRow, TextPrompt, ToggleRow } from '@/components/settings/controls';
import { PinPad } from '@/components/settings/pin-pad';
import { ACCENTS, type LockTimeout, type Preferences } from '@/data/preferences';
import { formatClock, formatDate } from '@/data/model';
import { Layout } from '@/constants/palette';
import { useScreenStatusBar, useSettingsTheme } from '@/hooks/use-settings-theme';
import { biometricKind, checkPin, hasPin, savePin } from '@/lib/app-lock';
import {
  chooseAvatar,
  clearCache,
  clearPersonalData,
  createLocalBackup,
  deleteAllData,
  exportTasksCsv,
  exportTasksJson,
  listLocalBackups,
  removeAvatar,
  restoreBackup,
  restorePickedFile,
  type BackupRecord,
} from '@/lib/device-data';
import { ensureReminderPermission } from '@/lib/reminders';
import { useCopy } from '@/lib/settings-copy';
import { formatBytes, readStorageBreakdown, type StorageBreakdown } from '@/lib/storage-info';
import { usePreferencesStore } from '@/store/preferences';
import { useTaskStore } from '@/store/tasks';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useSettingsTheme();
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  useScreenStatusBar(theme.dark);
  const letter = prefs.displayName.trim().charAt(0).toUpperCase() || 'S';

  return (
    <Screen>
      {theme.dark ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.canvas }]} /> : null}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + Layout.tabClearance,
          paddingHorizontal: Layout.padding,
        }}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.kicker, { color: theme.colors.muted, fontSize: 13 * theme.scale }]}>{text.onDevice}</Text>
            <Text style={[styles.title, { color: theme.colors.ink, fontSize: 34 * theme.scale }]}>{text.settings}</Text>
            {prefs.displayName ? (
              <Text style={[styles.name, { color: theme.colors.muted, fontSize: 15 * theme.scale }]}>{prefs.displayName}</Text>
            ) : null}
          </View>
          <View style={[styles.avatar, { backgroundColor: ACCENTS.find((item) => item.id === prefs.avatarColor)?.color ?? '#C8F06E' }]}>
            {prefs.avatarUri ? (
              <Image source={{ uri: prefs.avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarLetter}>{letter}</Text>
            )}
          </View>
        </View>

        <AppearanceSection />
        <ProductivitySection />
        <NotificationsSection />
        <FocusSection />
        <DataSection />
        <PrivacySection />
        <PersonalSection />
        <AboutSection />
      </ScrollView>
    </Screen>
  );
}

function AppearanceSection() {
  const text = useCopy();
  const theme = useSettingsTheme();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();

  return (
    <SettingsSection title={text.appearance} footer={text.themeHint}>
      <View style={styles.block}>
        <ChoiceChips
          value={prefs.theme}
          onChange={(themeChoice) => void save({ theme: themeChoice })}
          options={[
            { id: 'light', label: text.themeLight },
            { id: 'dark', label: text.themeDark },
            { id: 'system', label: text.themeSystem },
          ]}
        />
      </View>
      <Text style={[styles.blockLabel, { color: theme.colors.muted, fontSize: 13 * theme.scale }]}>{text.accent}</Text>
      <View style={styles.dots}>
        {ACCENTS.map((item) => {
          const selected = prefs.accent === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.id}
              accessibilityState={{ selected }}
              onPress={() => void save({ accent: item.id })}
              style={[styles.dot, { backgroundColor: item.color }, selected && { borderColor: theme.colors.ink }]}
            />
          );
        })}
      </View>
      <Text style={[styles.blockLabel, { color: theme.colors.muted, fontSize: 13 * theme.scale }]}>{text.fontSize}</Text>
      <ChoiceChips
        value={prefs.fontSize}
        onChange={(fontSize) => void save({ fontSize })}
        options={[
          { id: 'small', label: text.fontSmall },
          { id: 'default', label: text.fontDefault },
          { id: 'large', label: text.fontLarge },
        ]}
      />
      <ToggleRow icon="type" label={text.reduceMotion} value={prefs.reduceMotion} onChange={(reduceMotion) => void save({ reduceMotion })} border={false} />
    </SettingsSection>
  );
}

function ProductivitySection() {
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const [sheet, setSheet] = useState<'week' | 'priority' | 'done' | null>(null);
  const priorityLabel = prefs.defaultPriority === 'high' ? text.high : prefs.defaultPriority === 'medium' ? text.medium : text.low;
  const doneLabel =
    prefs.completedVisibility === 'show' ? text.showCompleted : prefs.completedVisibility === 'dim' ? text.dimCompleted : text.hideCompleted;
  const minutes = clockMinutes(prefs.planningStart);

  return (
    <SettingsSection title={text.productivity}>
      <SettingsRow icon="calendar" label={text.weekStart} value={prefs.weekStartsOn === 'sunday' ? text.sunday : text.monday} onPress={() => setSheet('week')} />
      <StepperRow
        icon="clock"
        label={text.planningStart}
        value={minutes}
        min={0}
        max={23 * 60 + 30}
        step={30}
        display={formatClock(prefs.planningStart)}
        onChange={(value) => void save({ planningStart: minutesToClock(value) })}
      />
      <SettingsRow icon="star" label={text.defaultPriority} value={priorityLabel} onPress={() => setSheet('priority')} />
      <StepperRow
        icon="timer"
        label={text.defaultDuration}
        value={prefs.defaultDuration}
        unit={text.minutes}
        min={15}
        max={180}
        step={15}
        onChange={(defaultDuration) => void save({ defaultDuration })}
      />
      <StepperRow
        icon="done"
        label={text.dailyGoal}
        value={prefs.dailyGoal}
        min={1}
        max={20}
        step={1}
        onChange={(dailyGoal) => void save({ dailyGoal })}
      />
      <SettingsRow icon="check" label={text.completedVisibility} value={doneLabel} onPress={() => setSheet('done')} border={false} />
      <OptionSheet
        visible={sheet === 'week'}
        title={text.weekStart}
        selected={prefs.weekStartsOn}
        options={[
          { id: 'monday', label: text.monday },
          { id: 'sunday', label: text.sunday },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(weekStartsOn) => {
          setSheet(null);
          void save({ weekStartsOn: weekStartsOn as Preferences['weekStartsOn'] });
        }}
      />
      <OptionSheet
        visible={sheet === 'priority'}
        title={text.defaultPriority}
        selected={prefs.defaultPriority}
        options={[
          { id: 'low', label: text.low },
          { id: 'medium', label: text.medium },
          { id: 'high', label: text.high },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(defaultPriority) => {
          setSheet(null);
          void save({ defaultPriority: defaultPriority as Preferences['defaultPriority'] });
        }}
      />
      <OptionSheet
        visible={sheet === 'done'}
        title={text.completedVisibility}
        selected={prefs.completedVisibility}
        options={[
          { id: 'show', label: text.showCompleted },
          { id: 'dim', label: text.dimCompleted },
          { id: 'hide', label: text.hideCompleted },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(completedVisibility) => {
          setSheet(null);
          void save({ completedVisibility: completedVisibility as Preferences['completedVisibility'] });
        }}
      />
    </SettingsSection>
  );
}

function NotificationsSection() {
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();

  async function toggle(key: 'taskReminders' | 'habitReminders' | 'dailyPlanning' | 'focusNotifications' | 'endOfDayReview' | 'notificationSound' | 'notificationVibration', value: boolean) {
    const needsPermission = value && key !== 'notificationSound' && key !== 'notificationVibration';
    if (needsPermission && Platform.OS !== 'web') {
      const allowed = await ensureReminderPermission();
      if (!allowed) {
        Alert.alert(text.notifications, text.permissionDenied);
        return;
      }
    }
    if (key === 'notificationVibration' && value && Platform.OS !== 'web') Vibration.vibrate(20);
    await save({ [key]: value });
  }

  return (
    <SettingsSection title={text.notifications} footer={text.reminderFoot}>
      <ToggleRow icon="bell" label={text.taskReminders} value={prefs.taskReminders} onChange={(value) => void toggle('taskReminders', value)} />
      <ToggleRow icon="check" label={text.habitReminders} value={prefs.habitReminders} onChange={(value) => void toggle('habitReminders', value)} />
      <ToggleRow icon="sun" label={text.dailyPlanning} value={prefs.dailyPlanning} onChange={(value) => void toggle('dailyPlanning', value)} />
      <ToggleRow icon="timer" label={text.focusNotifications} value={prefs.focusNotifications} onChange={(value) => void toggle('focusNotifications', value)} />
      <ToggleRow icon="moon" label={text.endOfDay} value={prefs.endOfDayReview} onChange={(value) => void toggle('endOfDayReview', value)} />
      <ToggleRow icon="speaker" label={text.sound} value={prefs.notificationSound} onChange={(value) => void toggle('notificationSound', value)} />
      <ToggleRow icon="wave" label={text.vibration} value={prefs.notificationVibration} onChange={(value) => void toggle('notificationVibration', value)} border={false} />
    </SettingsSection>
  );
}

function FocusSection() {
  const text = useCopy();
  const theme = useSettingsTheme();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();

  return (
    <SettingsSection title={text.focus} footer={text.focusFoot}>
      <StepperRow icon="timer" label={text.workDuration} value={prefs.workMinutes} unit={text.minutes} min={15} max={60} step={5} onChange={(workMinutes) => void save({ workMinutes })} />
      <StepperRow icon="clock" label={text.shortBreak} value={prefs.shortBreakMinutes} unit={text.minutes} min={1} max={20} step={1} onChange={(shortBreakMinutes) => void save({ shortBreakMinutes })} />
      <StepperRow icon="moon" label={text.longBreak} value={prefs.longBreakMinutes} unit={text.minutes} min={5} max={45} step={5} onChange={(longBreakMinutes) => void save({ longBreakMinutes })} />
      <StepperRow icon="restore" label={text.longBreakEvery} value={prefs.longBreakInterval} unit={text.sessions} min={2} max={8} step={1} onChange={(longBreakInterval) => void save({ longBreakInterval })} />
      <ToggleRow icon="clock" label={text.autoStartBreaks} value={prefs.autoStartBreaks} onChange={(autoStartBreaks) => void save({ autoStartBreaks })} />
      <ToggleRow icon="timer" label={text.autoStartFocus} value={prefs.autoStartFocus} onChange={(autoStartFocus) => void save({ autoStartFocus })} />
      <ToggleRow icon="sun" label={text.keepAwake} value={prefs.keepAwake} onChange={(keepAwake) => void save({ keepAwake })} />
      <Text style={[styles.soundLabel, { color: theme.colors.muted, fontSize: 13 * theme.scale }]}>{text.timerSound}</Text>
      <ChoiceChips
        value={prefs.timerSound}
        onChange={(timerSound) => void save({ timerSound })}
        options={[
          { id: 'chime', label: text.timerChime },
          { id: 'bell', label: text.timerBell },
          { id: 'none', label: text.timerSilent },
        ]}
      />
    </SettingsSection>
  );
}

function DataSection() {
  const text = useCopy();
  const theme = useSettingsTheme();
  const tasks = useTaskStore((state) => state.tasks.filter((task) => task.kind === 'task').length);
  const lastBackupAt = usePreferencesStore((state) => state.prefs.lastBackupAt);
  const [storage, setStorage] = useState<StorageBreakdown>(() => readStorageBreakdown());
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [restoreOpen, setRestoreOpen] = useState(false);

  const refresh = useCallback(() => setStorage(readStorageBreakdown()), []);
  useFocusEffect(refresh);

  async function run(id: string, action: () => Promise<void>, success: string) {
    if (busy) return;
    setBusy(id);
    setNotice(null);
    try {
      await action();
      setNotice(success);
      refresh();
    } catch (error) {
      Alert.alert(text.data, error instanceof Error ? error.message : text.backupFailed);
    } finally {
      setBusy(null);
    }
  }

  function confirmDelete() {
    Alert.alert(text.deleteAll, text.deleteAllBody, [
      { text: text.cancel, style: 'cancel' },
      {
        text: text.deleteAll,
        style: 'destructive',
        onPress: () => void run('delete', deleteAllData, text.deleted),
      },
    ]);
  }

  const database = storage.databaseBytes == null ? text.unavailable : formatBytes(storage.databaseBytes);
  const notes = storage.noteCount == null ? '—' : String(storage.noteCount);

  return (
    <SettingsSection title={text.data} footer={notice ?? text.habitsFoot}>
      <View style={styles.stats}>
        <Stat value={database} label={text.database} />
        <Stat value={formatWhen(lastBackupAt, text.never)} label={text.lastBackup} />
      </View>
      <View style={styles.stats}>
        <Stat value={String(tasks)} label={text.tasks} />
        <Stat value="0" label={text.habits} />
        <Stat value={notes} label={text.notes} />
      </View>
      <SettingsRow icon="share" label={text.exportJson} value={busy === 'json' ? text.working : undefined} onPress={() => void run('json', exportTasksJson, text.exported)} />
      <SettingsRow icon="doc" label={text.exportCsv} value={busy === 'csv' ? text.working : undefined} onPress={() => void run('csv', exportTasksCsv, text.exported)} />
      <SettingsRow icon="download" label={text.createBackup} value={busy === 'backup' ? text.working : undefined} onPress={() => void run('backup', createLocalBackup, text.savedBackup)} />
      <SettingsRow
        icon="restore"
        label={text.restoreBackup}
        onPress={() => {
          setBackups(listLocalBackups());
          setRestoreOpen(true);
        }}
      />
      <SettingsRow
        icon="storage"
        label={text.storageInfo}
        onPress={() =>
          Alert.alert(
            text.storageInfo,
            `${text.database}: ${database}\n${text.notes}: ${storage.notesBytes == null ? text.unavailable : formatBytes(storage.notesBytes)}\n${text.lastBackup}: ${storage.backupBytes == null ? text.unavailable : formatBytes(storage.backupBytes)}\n\n${text.storageBody}`,
          )
        }
      />
      <SettingsRow icon="trash" label={text.clearCache} value={busy === 'cache' ? text.working : undefined} onPress={() => void run('cache', clearCache, text.cacheCleared)} />
      <SettingsRow icon="trash" label={text.deleteAll} danger border={false} onPress={confirmDelete} />
      <Modal visible={restoreOpen} transparent animationType="fade" onRequestClose={() => setRestoreOpen(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: theme.colors.overlay }]} onPress={() => setRestoreOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.colors.card }]} onPress={() => undefined}>
            <Text style={[styles.sheetTitle, { color: theme.colors.ink, fontSize: 18 * theme.scale }]}>{text.restoreBackup}</Text>
            {backups.length === 0 ? <Text style={{ color: theme.colors.muted, marginBottom: 12 }}>{text.noBackups}</Text> : null}
            {backups.map((backup) => (
              <Pressable
                key={backup.uri}
                style={styles.backupRow}
                onPress={() => {
                  Alert.alert(text.restoreBackup, text.confirmRestore, [
                    { text: text.cancel, style: 'cancel' },
                    {
                      text: text.confirm,
                      onPress: () => {
                        setRestoreOpen(false);
                        void run('restore', () => restoreBackup(backup), text.restored);
                      },
                    },
                  ]);
                }}>
                <Text style={{ color: theme.colors.ink, fontWeight: 600, flex: 1 }}>{backup.name}</Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.backupRow}
              onPress={() => {
                setRestoreOpen(false);
                void run(
                  'restore',
                  async () => {
                    const restored = await restorePickedFile();
                    if (!restored) return;
                  },
                  text.restored,
                );
              }}>
              <Text style={{ color: theme.colors.ink, fontWeight: 700 }}>{text.chooseFile}</Text>
            </Pressable>
            <Pressable onPress={() => setRestoreOpen(false)} style={styles.backupRow}>
              <Text style={{ color: theme.colors.muted, fontWeight: 700 }}>{text.close}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SettingsSection>
  );
}

function PrivacySection() {
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
    <SettingsSection title={text.privacy} footer={text.hideHint}>
      <ToggleRow icon="lock" label={text.appLock} value={prefs.appLockEnabled} onChange={(value) => void toggleLock(value)} />
      <ToggleRow icon="personCircle" label={text.biometrics} value={prefs.useBiometrics} onChange={(value) => void toggleBiometrics(value)} disabled={!prefs.appLockEnabled && !prefs.useBiometrics} />
      <SettingsRow icon="clock" label={text.lockTimeout} value={timeoutLabel} onPress={() => setSheet(true)} />
      {prefs.appLockEnabled ? <SettingsRow icon="lock" label={text.changePin} onPress={() => setPinMode('change')} /> : null}
      <ToggleRow icon="eyeOff" label={text.hideSensitive} value={prefs.hideSensitive} onChange={(hideSensitive) => void save({ hideSensitive })} />
      <SettingsRow icon="shield" label={text.privacyInfo} onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })} />
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
    </SettingsSection>
  );
}

function PersonalSection() {
  const text = useCopy();
  const theme = useSettingsTheme();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const [nameOpen, setNameOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [sheet, setSheet] = useState<'language' | 'time' | 'date' | 'week' | null>(null);

  return (
    <SettingsSection title={text.personal}>
      <SettingsRow icon="person" label={text.displayName} value={prefs.displayName || text.yourName} onPress={() => setNameOpen(true)} />
      <SettingsRow icon="personCircle" label={text.avatar} onPress={() => setAvatarOpen(true)} />
      <SettingsRow icon="globe" label={text.language} value={prefs.language === 'sw' ? text.kiswahili : text.english} onPress={() => setSheet('language')} />
      <SettingsRow icon="clock" label={text.timeFormat} value={prefs.timeFormat === '24' ? text.hour24 : text.hour12} onPress={() => setSheet('time')} />
      <SettingsRow icon="calendar" label={text.dateFormat} value={formatDate(new Date(2026, 10, 18), prefs.dateFormat)} onPress={() => setSheet('date')} />
      <SettingsRow icon="calendar" label={text.weekStart} value={prefs.weekStartsOn === 'sunday' ? text.sunday : text.monday} onPress={() => setSheet('week')} border={false} />
      <TextPrompt
        visible={nameOpen}
        title={text.displayName}
        initial={prefs.displayName}
        placeholder={text.namePlaceholder}
        onClose={() => setNameOpen(false)}
        onSave={(displayName) => {
          setNameOpen(false);
          void save({ displayName });
        }}
      />
      <Modal visible={avatarOpen} transparent animationType="fade" onRequestClose={() => setAvatarOpen(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: theme.colors.overlay }]} onPress={() => setAvatarOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.colors.card }]} onPress={() => undefined}>
            <Text style={[styles.sheetTitle, { color: theme.colors.ink }]}>{text.avatar}</Text>
            <View style={styles.dots}>
              {ACCENTS.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => void save({ avatarColor: item.id })}
                  style={[styles.dot, { backgroundColor: item.color }, prefs.avatarColor === item.id && { borderColor: theme.colors.ink }]}
                />
              ))}
            </View>
            <Pressable
              style={styles.backupRow}
              onPress={() => {
                void chooseAvatar()
                  .then((uri) => {
                    if (uri) void save({ avatarUri: uri });
                  })
                  .catch(() => Alert.alert(text.avatar, text.photoFailed));
              }}>
              <Text style={{ color: theme.colors.ink, fontWeight: 700 }}>{text.choosePhoto}</Text>
            </Pressable>
            {prefs.avatarUri ? (
              <Pressable
                style={styles.backupRow}
                onPress={() => {
                  void removeAvatar().catch(() => Alert.alert(text.avatar, text.photoFailed));
                }}>
                <Text style={{ color: theme.colors.danger, fontWeight: 700 }}>{text.removePhoto}</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => setAvatarOpen(false)} style={styles.backupRow}>
              <Text style={{ color: theme.colors.muted, fontWeight: 700 }}>{text.close}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <OptionSheet
        visible={sheet === 'language'}
        title={text.language}
        selected={prefs.language}
        options={[
          { id: 'en', label: text.english },
          { id: 'sw', label: text.kiswahili },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(language) => {
          setSheet(null);
          void save({ language: language as Preferences['language'] });
        }}
      />
      <OptionSheet
        visible={sheet === 'time'}
        title={text.timeFormat}
        selected={prefs.timeFormat}
        options={[
          { id: '12', label: text.hour12 },
          { id: '24', label: text.hour24 },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(timeFormat) => {
          setSheet(null);
          void save({ timeFormat: timeFormat as Preferences['timeFormat'] });
        }}
      />
      <OptionSheet
        visible={sheet === 'date'}
        title={text.dateFormat}
        selected={prefs.dateFormat}
        options={[
          { id: 'dmy', label: formatDate(new Date(2026, 10, 18), 'dmy') },
          { id: 'mdy', label: formatDate(new Date(2026, 10, 18), 'mdy') },
          { id: 'ymd', label: formatDate(new Date(2026, 10, 18), 'ymd') },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(dateFormat) => {
          setSheet(null);
          void save({ dateFormat: dateFormat as Preferences['dateFormat'] });
        }}
      />
      <OptionSheet
        visible={sheet === 'week'}
        title={text.weekStart}
        selected={prefs.weekStartsOn}
        options={[
          { id: 'monday', label: text.monday },
          { id: 'sunday', label: text.sunday },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(weekStartsOn) => {
          setSheet(null);
          void save({ weekStartsOn: weekStartsOn as Preferences['weekStartsOn'] });
        }}
      />
    </SettingsSection>
  );
}

function AboutSection() {
  const text = useCopy();
  return (
    <SettingsSection title={text.about}>
      <SettingsRow icon="info" label={text.aboutShughuli} onPress={() => router.push('/about')} />
      <SettingsRow icon="shield" label={text.privacyPolicy} onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })} />
      <SettingsRow icon="doc" label={text.terms} onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })} border={false} />
    </SettingsSection>
  );
}

function PinEditor({
  visible,
  mode,
  onClose,
  onSaved,
}: {
  visible: boolean;
  mode: 'create' | 'change';
  onClose: () => void;
  onSaved: () => void;
}) {
  const text = useCopy();
  const theme = useSettingsTheme();
  const [step, setStep] = useState<'verify' | 'create' | 'confirm'>(mode === 'change' ? 'verify' : 'create');
  const [first, setFirst] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  const title = step === 'verify' ? text.currentPin : step === 'confirm' ? text.confirmPin : text.choosePin;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        setStep(mode === 'change' ? 'verify' : 'create');
        setFirst('');
        setError('');
        setAttempt(0);
      }}>
      <View style={[styles.pinScreen, { backgroundColor: theme.dark ? theme.colors.canvas : '#FBF6F3' }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={text.close} onPress={onClose} style={styles.pinClose}>
          <Icon name="close" size={18} color={theme.colors.ink} />
        </Pressable>
        <PinPad
          key={`${step}-${attempt}`}
          title={text.appLock}
          subtitle={title}
          error={error}
          onSubmit={(pin) => {
            if (step === 'verify') {
              void checkPin(pin).then((ok) => {
                if (!ok) {
                  setError(text.pinMismatch);
                  setAttempt((current) => current + 1);
                  return;
                }
                setError('');
                setStep('create');
              });
              return;
            }
            if (step === 'create') {
              setFirst(pin);
              setError('');
              setStep('confirm');
              return;
            }
            if (pin !== first) {
              setFirst('');
              setError(text.pinMismatch);
              setStep('create');
              setAttempt((current) => current + 1);
              return;
            }
            void savePin(pin)
              .then(onSaved)
              .catch((pinError: unknown) => setError(pinError instanceof Error ? pinError.message : text.couldNotSave));
          }}
        />
      </View>
    </Modal>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const theme = useSettingsTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.colors.icon }]}>
      <Text style={[styles.statValue, { color: theme.colors.ink, fontSize: 16 * theme.scale }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.colors.muted, fontSize: 12 * theme.scale }]}>{label}</Text>
    </View>
  );
}

function useSave() {
  const update = usePreferencesStore((state) => state.update);
  const text = useCopy();
  return async (patch: Partial<Preferences>) => {
    try {
      await update(patch);
    } catch {
      Alert.alert(text.settings, text.couldNotSave);
    }
  };
}

function formatWhen(iso: string | null, never: string) {
  if (!iso) return never;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return never;
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${formatDate(date)} ${formatClock(time)}`;
}

function clockMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function minutesToClock(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    fontWeight: 600,
  },
  title: {
    marginTop: 4,
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  name: {
    marginTop: 4,
    fontWeight: 600,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 64,
    height: 64,
  },
  avatarLetter: {
    fontSize: 26,
    fontWeight: 700,
    color: '#161616',
  },
  block: {
    paddingTop: 16,
  },
  blockLabel: {
    marginLeft: 16,
    marginBottom: 8,
    fontWeight: 700,
  },
  dots: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  soundLabel: {
    marginLeft: 16,
    marginTop: 4,
    marginBottom: -4,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  stat: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 700,
  },
  statLabel: {
    marginTop: 2,
    fontWeight: 600,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  sheetTitle: {
    fontWeight: 700,
    marginBottom: 8,
  },
  backupRow: {
    minHeight: 48,
    justifyContent: 'center',
  },
  pinScreen: {
    flex: 1,
  },
  pinClose: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
