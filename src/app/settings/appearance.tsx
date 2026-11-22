import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NightCard, NightFoot, NightPage, NightSwitch } from '@/components/settings/night-page';
import { useSave } from '@/components/settings/page';
import { Night } from '@/constants/night';
import type { Preferences } from '@/data/preferences';
import { formatLocale } from '@/i18n/format';
import { playCompleteTone } from '@/lib/complete-tone';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

type Sheet = 'home' | 'zone' | 'week' | 'next' | 'weekend' | 'links' | 'tone' | 'right' | 'left' | null;

const ZONES = ['Europe/Amsterdam', 'Africa/Nairobi', 'Africa/Lagos', 'America/New_York', 'America/Los_Angeles', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Tokyo', 'UTC'];

export default function AppearanceScreen() {
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const [sheet, setSheet] = useState<Sheet>(null);
  const deviceZone = deviceTimeZone();
  const homeLabel = prefs.homeView === 'inbox' ? text.inbox : prefs.homeView === 'upcoming' ? text.upcoming : text.today;
  const zoneLabel = prefs.timeZone || deviceZone;
  const linkLabel = prefs.webLinks === 'browser' ? text.linkInBrowser : text.linkInApp;

  return (
    <NightPage title={text.general}>
      <Text style={styles.section}>{text.homeSection}</Text>
      <NightCard>
        <ValueRow label={text.homeView} value={homeLabel} onPress={() => setSheet('home')} />
        <NightSwitch label={text.syncHomeView} value={prefs.syncHomeView} onChange={(syncHomeView) => void save({ syncHomeView })} last />
      </NightCard>
      <NightFoot>{text.syncHomeViewFoot}</NightFoot>

      <Text style={styles.section}>{text.smartRecognition}</Text>
      <NightCard>
        <NightSwitch label={text.detectDates} value={prefs.detectDates} onChange={(detectDates) => void save({ detectDates })} last />
      </NightCard>

      <Text style={styles.section}>{text.subTasksSection}</Text>
      <NightCard>
        <NightSwitch label={text.resetSubtasks} value={prefs.resetSubtasks} onChange={(resetSubtasks) => void save({ resetSubtasks })} last />
      </NightCard>
      <Text style={styles.note}>
        {text.resetSubtasksFoot}{' '}
        <Text style={styles.link} onPress={() => Alert.alert(text.resetSubtasks, text.resetSubtasksMore)}>
          {text.learnMore}
        </Text>
      </Text>

      <Text style={styles.section}>{text.sharedProjects}</Text>
      <NightCard>
        <NightSwitch label={text.autoAcceptInvites} value={prefs.autoAcceptInvites} onChange={(autoAcceptInvites) => void save({ autoAcceptInvites })} last />
      </NightCard>
      <NightFoot>{text.autoAcceptFoot}</NightFoot>

      <Text style={styles.section}>{text.dateAndTime}</Text>
      <NightCard>
        <ValueRow label={text.timezone} value={zoneLabel} onPress={() => setSheet('zone')} />
        <ValueRow label={text.startWeekOn} value={weekdayName(prefs.weekStartsOn === 'sunday' ? 0 : 1)} onPress={() => setSheet('week')} />
        <ValueRow label={text.nextWeekAs} value={weekdayName(prefs.nextWeekday)} onPress={() => setSheet('next')} />
        <ValueRow label={text.weekendAs} value={weekdayName(prefs.weekendDay)} onPress={() => setSheet('weekend')} last />
      </NightCard>
      <Text style={styles.note}>
        {text.dateTimeFoot}{' '}
        <Text style={styles.link} onPress={() => router.push({ pathname: '/settings/productivity', params: { part: 'plan' } })}>
          {text.productivitySettings}
        </Text>
      </Text>

      <Text style={styles.section}>{text.appSettings}</Text>
      <NightCard>
        <ValueRow label={text.openWebLinks} value={linkLabel} onPress={() => setSheet('links')} last />
      </NightCard>

      <Text style={styles.section}>{text.soundSection}</Text>
      <NightCard>
        <ValueRow label={text.taskCompleteTone} onPress={() => setSheet('tone')} last />
      </NightCard>

      <Text style={styles.section}>{text.swipeActions}</Text>
      <NightCard>
        <ValueRow label={text.rightSwipe} value={swipeLabel(prefs.rightSwipe, text)} onPress={() => setSheet('right')} />
        <ValueRow label={text.leftSwipe} value={swipeLabel(prefs.leftSwipe, text)} onPress={() => setSheet('left')} last />
      </NightCard>

      <ChoiceSheet
        visible={sheet === 'home'}
        title={text.homeView}
        selected={prefs.homeView}
        options={[
          { id: 'inbox', label: text.inbox },
          { id: 'today', label: text.today },
          { id: 'upcoming', label: text.upcoming },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(homeView) => {
          setSheet(null);
          void save({ homeView: homeView as Preferences['homeView'] });
        }}
      />
      <ChoiceSheet
        visible={sheet === 'zone'}
        title={text.timezone}
        selected={prefs.timeZone || deviceZone}
        options={[{ id: deviceZone, label: `${deviceZone} · ${text.deviceTimezone}` }, ...ZONES.filter((zone) => zone !== deviceZone).map((zone) => ({ id: zone, label: zone }))]}
        onClose={() => setSheet(null)}
        onSelect={(timeZone) => {
          setSheet(null);
          void save({ timeZone: timeZone === deviceZone ? '' : timeZone });
        }}
      />
      <ChoiceSheet
        visible={sheet === 'week'}
        title={text.startWeekOn}
        selected={prefs.weekStartsOn}
        options={[
          { id: 'monday', label: weekdayName(1) },
          { id: 'sunday', label: weekdayName(0) },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(weekStartsOn) => {
          setSheet(null);
          void save({ weekStartsOn: weekStartsOn as Preferences['weekStartsOn'] });
        }}
      />
      <ChoiceSheet
        visible={sheet === 'next'}
        title={text.nextWeekAs}
        selected={String(prefs.nextWeekday)}
        options={[1, 0, 6].map((day) => ({ id: String(day), label: weekdayName(day) }))}
        onClose={() => setSheet(null)}
        onSelect={(id) => {
          setSheet(null);
          void save({ nextWeekday: Number(id) });
        }}
      />
      <ChoiceSheet
        visible={sheet === 'weekend'}
        title={text.weekendAs}
        selected={String(prefs.weekendDay)}
        options={[6, 0, 5].map((day) => ({ id: String(day), label: weekdayName(day) }))}
        onClose={() => setSheet(null)}
        onSelect={(id) => {
          setSheet(null);
          void save({ weekendDay: Number(id) as Preferences['weekendDay'] });
        }}
      />
      <ChoiceSheet
        visible={sheet === 'links'}
        title={text.openWebLinks}
        selected={prefs.webLinks}
        options={[
          { id: 'app', label: text.linkInApp },
          { id: 'browser', label: text.linkInBrowser },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(webLinks) => {
          setSheet(null);
          void save({ webLinks: webLinks as Preferences['webLinks'] });
        }}
      />
      <ChoiceSheet
        visible={sheet === 'tone'}
        title={text.taskCompleteTone}
        selected={prefs.completeTone}
        options={[
          { id: 'chime', label: text.timerChime },
          { id: 'bell', label: text.timerBell },
          { id: 'none', label: text.timerSilent },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(completeTone) => {
          setSheet(null);
          const tone = completeTone as Preferences['completeTone'];
          void save({ completeTone: tone });
          void playCompleteTone(tone);
        }}
      />
      <ChoiceSheet
        visible={sheet === 'right'}
        title={text.rightSwipe}
        selected={prefs.rightSwipe}
        options={swipeOptions(text)}
        onClose={() => setSheet(null)}
        onSelect={(rightSwipe) => {
          setSheet(null);
          void save({ rightSwipe: rightSwipe as Preferences['rightSwipe'] });
        }}
      />
      <ChoiceSheet
        visible={sheet === 'left'}
        title={text.leftSwipe}
        selected={prefs.leftSwipe}
        options={swipeOptions(text)}
        onClose={() => setSheet(null)}
        onSelect={(leftSwipe) => {
          setSheet(null);
          void save({ leftSwipe: leftSwipe as Preferences['leftSwipe'] });
        }}
      />
    </NightPage>
  );
}

function swipeOptions(text: ReturnType<typeof useCopy>) {
  return [
    { id: 'select', label: text.swipeSelect },
    { id: 'schedule', label: text.swipeSchedule },
    { id: 'complete', label: text.swipeComplete },
    { id: 'none', label: text.none },
  ];
}

function swipeLabel(action: Preferences['rightSwipe'], text: ReturnType<typeof useCopy>) {
  if (action === 'schedule') return text.swipeSchedule;
  if (action === 'complete') return text.swipeComplete;
  if (action === 'none') return text.none;
  return text.swipeSelect;
}

function weekdayName(day: number) {
  return formatLocale(new Date(2026, 0, 4 + day), { weekday: 'long' });
}

function deviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function ValueRow({ label, value, onPress, last = false }: { label: string; value?: string; onPress: () => void; last?: boolean }) {
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <Text style={styles.label}>{label}</Text>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        <Icon name="chevron" size={16} color={Night.faint} />
      </Pressable>
      {last ? null : <View style={styles.line} />}
    </View>
  );
}

function ChoiceSheet({
  visible,
  title,
  options,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: { id: string; label: string }[];
  selected?: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map((option) => (
            <Pressable key={option.id} accessibilityRole="button" onPress={() => onSelect(option.id)} style={styles.sheetRow}>
              <Text style={styles.label}>{option.label}</Text>
              {option.id === selected ? <Icon name="check" size={16} color={Night.accent} /> : null}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 26,
    marginBottom: -8,
    marginLeft: 4,
    color: Night.muted,
    fontSize: 16,
    fontWeight: 600,
  },
  row: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  value: {
    maxWidth: 150,
    color: Night.muted,
    fontSize: 16,
    fontWeight: 500,
  },
  line: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    backgroundColor: '#3A3A3A',
  },
  note: {
    marginTop: 10,
    marginHorizontal: 4,
    color: Night.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
  link: {
    color: Night.accent,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.72,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: Night.row,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sheetTitle: {
    marginBottom: 8,
    paddingHorizontal: 16,
    color: Night.text,
    fontSize: 18,
    fontWeight: 700,
  },
  sheetRow: {
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
