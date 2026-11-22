import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { SettingsRow, SettingsSection } from '@/components/settings/controls';
import { SettingsPage, Stat, formatWhen, settingsStyles } from '@/components/settings/page';
import { useSettingsTheme } from '@/hooks/use-settings-theme';
import {
  ActionCancelled,
  clearCache,
  createLocalBackup,
  deleteAllData,
  exportTasksCsv,
  exportTasksJson,
  listLocalBackups,
  restoreBackup,
  restorePickedFile,
  type BackupRecord,
} from '@/lib/device-data';
import { useCopy } from '@/lib/settings-copy';
import { formatBytes, readStorageBreakdown, type StorageBreakdown } from '@/lib/storage-info';
import { usePreferencesStore } from '@/store/preferences';
import { useTaskStore } from '@/store/tasks';

export default function DataScreen() {
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
      if (error instanceof ActionCancelled) return;
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
    <SettingsPage title={text.data}>
      <SettingsSection footer={notice ?? text.habitsFoot}>
        <View style={settingsStyles.stats}>
          <Stat value={database} label={text.database} />
          <Stat value={formatWhen(lastBackupAt, text.never)} label={text.lastBackup} />
        </View>
        <View style={settingsStyles.stats}>
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
      </SettingsSection>
      <Modal visible={restoreOpen} transparent animationType="fade" onRequestClose={() => setRestoreOpen(false)}>
        <Pressable style={[settingsStyles.overlay, { backgroundColor: theme.colors.overlay }]} onPress={() => setRestoreOpen(false)}>
          <Pressable style={[settingsStyles.sheet, { backgroundColor: theme.colors.card }]} onPress={() => undefined}>
            <Text style={[settingsStyles.sheetTitle, { color: theme.colors.ink, fontSize: 18 * theme.scale }]}>{text.restoreBackup}</Text>
            {backups.length === 0 ? <Text style={{ color: theme.colors.muted, marginBottom: 12 }}>{text.noBackups}</Text> : null}
            {backups.map((backup) => (
              <Pressable
                key={backup.uri}
                style={settingsStyles.backupRow}
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
              style={settingsStyles.backupRow}
              onPress={() => {
                setRestoreOpen(false);
                void run('restore', () => restorePickedFile(), text.restored);
              }}>
              <Text style={{ color: theme.colors.ink, fontWeight: 700 }}>{text.chooseFile}</Text>
            </Pressable>
            <Pressable onPress={() => setRestoreOpen(false)} style={settingsStyles.backupRow}>
              <Text style={{ color: theme.colors.muted, fontWeight: 700 }}>{text.close}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SettingsPage>
  );
}
