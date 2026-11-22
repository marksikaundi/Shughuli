import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { GoogleCalendarLogo, OutlookLogo } from '@/components/calendar-logos';

import { NightCard, NightFoot, NightPage } from '@/components/settings/night-page';
import { Night } from '@/constants/night';
import {
  calendarAccessGranted,
  connectGoogleCalendar,
  connectOutlookCalendar,
  pullGoogleEvents,
  readCalendarLink,
  syncAllTasks,
} from '@/lib/google-calendar';
import { useCopy } from '@/lib/settings-copy';
import { useTaskStore } from '@/store/tasks';

type Links = Awaited<ReturnType<typeof readCalendarLink>>;

export default function CalendarSettingsScreen() {
  const text = useCopy();
  const [links, setLinks] = useState<Links>(null);
  const [busy, setBusy] = useState<'google' | 'outlook' | null>(null);
  const [pending, setPending] = useState<'google' | 'outlook' | null>(null);
  const [more, setMore] = useState(false);
  const consentResolver = useRef<((allowed: boolean) => void) | null>(null);

  useFocusEffect(
    useCallback(() => {
      void readCalendarLink().then(setLinks);
      return () => answer(false);
    }, []),
  );

  function askConsent(kind: 'google' | 'outlook') {
    return new Promise<boolean>((resolve) => {
      consentResolver.current = resolve;
      setPending(kind);
    });
  }

  function answer(allowed: boolean) {
    consentResolver.current?.(allowed);
    consentResolver.current = null;
    setPending(null);
  }

  async function connect(kind: 'google' | 'outlook') {
    if (busy) return;
    let granted = false;
    try {
      granted = await calendarAccessGranted();
    } catch {
      granted = false;
    }
    const consent = granted || (await askConsent(kind));
    if (!consent) return;
    setBusy(kind);
    try {
      const next = kind === 'google' ? await connectGoogleCalendar(true) : await connectOutlookCalendar(true);
      await pullGoogleEvents((incoming) => useTaskStore.getState().importTasks(incoming));
      await syncAllTasks(useTaskStore.getState().tasks);
      setLinks(next);
    } catch (error) {
      const title = kind === 'google' ? text.googleCalendar : text.connectOutlook;
      const fallback = kind === 'google' ? text.googleConnectFailed : text.outlookConnectFailed;
      Alert.alert(title, error instanceof Error ? error.message : fallback);
    } finally {
      setBusy(null);
    }
  }

  const googleAccount = links?.googleAccount || (links && !links.outlookAccount ? links.account : null);

  return (
    <NightPage title={text.tabCalendar}>
      <View style={styles.connectRow}>
        <ConnectButton mark={<GoogleCalendarLogo />} label={text.connectGoogle} account={googleAccount} busy={busy === 'google'} onPress={() => void connect('google')} />
        <ConnectButton mark={<OutlookLogo />} label={text.connectOutlook} account={links?.outlookAccount} busy={busy === 'outlook'} onPress={() => void connect('outlook')} />
      </View>
      <NightFoot>{text.calendarIntro}</NightFoot>

      <Text style={styles.section}>{text.whatYouCanDo}</Text>
      <NightCard>
        <TodayPreview />
        <Text style={styles.cardTitle}>{text.seeEventsTitle}</Text>
        <Text style={styles.cardBody}>
          {text.seeEventsBody}{' '}
          <Text style={styles.link} onPress={() => setMore(true)}>
            {text.learnMore}
          </Text>
        </Text>
      </NightCard>
      <NightCard>
        <SyncPreview />
        <Text style={styles.cardTitle}>{text.syncTasksTitle}</Text>
        <Text style={styles.cardBody}>{text.syncTasksBody}</Text>
      </NightCard>
      <ConsentDialog kind={pending} onAllow={() => answer(true)} onClose={() => answer(false)} />
      <InfoDialog visible={more} title={text.seeEventsTitle} body={text.seeEventsMore} action={text.close} onClose={() => setMore(false)} />
    </NightPage>
  );
}

function ConnectButton({
  mark,
  label,
  account,
  busy,
  onPress,
}: {
  mark: ReactNode;
  label: string;
  account?: string | null;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={busy} onPress={onPress} style={({ pressed }) => [styles.connect, pressed && styles.pressed]}>
      {mark}
      <View style={styles.connectCopy}>
        <Text style={styles.connectLabel}>{label}</Text>
        {account ? <Text style={styles.account}>{account}</Text> : null}
      </View>
    </Pressable>
  );
}

function TodayPreview() {
  const rows = [
    { color: '#E15B52', title: '06:00  Vet appointment' },
    { color: '#5B8DEF', title: '08:00  Meeting' },
    { color: '#3CBF73', title: '12:00  Flight check-in' },
  ];
  return (
    <View style={styles.preview}>
      <View style={styles.todayPane}>
        <Text style={styles.previewTitle}>Today</Text>
        {rows.map((row) => (
          <View key={row.title} style={styles.eventRow}>
            <View style={[styles.eventBar, { backgroundColor: row.color }]} />
            <Text style={styles.eventText}>{row.title}</Text>
          </View>
        ))}
      </View>
      <View style={styles.phone}>
        <Text style={styles.phoneTitle}>Upcoming</Text>
        <View style={[styles.block, { backgroundColor: '#E07A72', height: 28 }]} />
        <View style={styles.phoneRow}>
          <View style={[styles.block, { backgroundColor: '#C45C55', flex: 1 }]} />
          <View style={[styles.block, { backgroundColor: '#D98A55', flex: 1 }]} />
        </View>
      </View>
    </View>
  );
}

function SyncPreview() {
  const cells = ['#6EA8FE', '#E07A72', '#C47A4A', '#E2B84A', '#6FAE8A', '#5E9A86'];
  return (
    <View style={styles.gridPreview}>
      {cells.map((color, index) => (
        <View key={`${color}-${index}`} style={[styles.gridCell, { backgroundColor: color }]}>
          <Text style={styles.gridText}>{index === 0 ? '10:00' : '10:00 – 11:40'}</Text>
        </View>
      ))}
    </View>
  );
}

function InfoDialog({ visible, title, body, action, onClose }: { visible: boolean; title: string; body: string; action: string; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={() => undefined}>
          <View style={styles.dialogMarks}>
            <View style={[styles.markChip, { backgroundColor: '#3A3A3A' }]}>
              <GoogleCalendarLogo size={22} />
            </View>
            <View style={[styles.markChip, { backgroundColor: '#3A3A3A' }]}>
              <OutlookLogo size={22} />
            </View>
          </View>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogBody}>{body}</Text>
          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.continue, pressed && styles.pressed]}>
            <Text style={styles.continueText}>{action}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ConsentDialog({ kind, onAllow, onClose }: { kind: 'google' | 'outlook' | null; onAllow: () => void; onClose: () => void }) {
  const text = useCopy();
  const outlook = kind === 'outlook';
  return (
    <Modal visible={kind !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={() => undefined}>
          {outlook ? <OutlookLogo /> : <GoogleCalendarLogo />}
          <Text style={styles.dialogTitle}>{outlook ? text.connectOutlook : text.googleCalendar}</Text>
          <Text style={styles.dialogBody}>{text.calendarConsentRead}</Text>
          <Text style={styles.dialogBody}>{text.calendarConsentWrite}</Text>
          <Text style={styles.dialogBody}>{text.calendarConsentKeep}</Text>
          <Pressable accessibilityRole="button" onPress={onAllow} style={({ pressed }) => [styles.continue, pressed && styles.pressed]}>
            <Text style={styles.continueText}>{text.confirm}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}>
            <Text style={styles.dismissText}>{text.notNow}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  connectRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 12,
  },
  connect: {
    flex: 1,
    minHeight: 96,
    borderRadius: 16,
    backgroundColor: Night.row,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  connectCopy: {
    alignItems: 'center',
  },
  connectLabel: {
    color: Night.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 700,
    textAlign: 'center',
  },
  account: {
    marginTop: 2,
    color: Night.muted,
    fontSize: 12,
    fontWeight: 500,
    textAlign: 'center',
  },
  section: {
    marginTop: 28,
    marginBottom: -6,
    marginLeft: 4,
    color: Night.text,
    fontSize: 22,
    fontWeight: 700,
  },
  cardTitle: {
    marginTop: 14,
    marginHorizontal: 16,
    color: Night.text,
    fontSize: 18,
    fontWeight: 700,
  },
  cardBody: {
    marginTop: 6,
    marginBottom: 16,
    marginHorizontal: 16,
    color: Night.muted,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: 500,
  },
  link: {
    color: Night.accent,
    fontWeight: 700,
  },
  preview: {
    margin: 12,
    borderRadius: 16,
    backgroundColor: '#242424',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  todayPane: {
    flex: 1,
    gap: 10,
  },
  previewTitle: {
    color: Night.text,
    fontSize: 22,
    fontWeight: 700,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  eventText: {
    color: Night.text,
    fontSize: 12,
    fontWeight: 600,
  },
  phone: {
    width: 118,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    padding: 8,
    gap: 6,
  },
  phoneTitle: {
    color: Night.muted,
    fontSize: 11,
    fontWeight: 700,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 6,
  },
  block: {
    height: 22,
    borderRadius: 6,
  },
  gridPreview: {
    margin: 12,
    borderRadius: 16,
    backgroundColor: '#242424',
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCell: {
    width: '47%',
    height: 54,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'flex-end',
  },
  gridText: {
    color: '#1A1A1A',
    fontSize: 11,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.72,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    gap: 10,
  },
  dialogMarks: {
    flexDirection: 'row',
    gap: 10,
  },
  markChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    color: Night.text,
    fontSize: 22,
    fontWeight: 700,
  },
  dialogBody: {
    color: Night.muted,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: 500,
  },
  continue: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: Night.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
  },
  dismiss: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: Night.muted,
    fontSize: 16,
    fontWeight: 700,
  },
});
