import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Icon, IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { accentById } from '@/data/preferences';
import {
  formatClock,
  startOfWeek,
  toDateKey,
  useTasks,
  type Task,
} from '@/data/tasks';
import {
  calendarAccessGranted,
  connectGoogleCalendar,
  googleEventsOn,
  pullGoogleEvents,
  readCalendarLink,
  syncAllTasks,
  type GoogleScheduleItem,
} from '@/lib/google-calendar';
import { formatWeekday } from '@/i18n/format';
import { fill, getCopy, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';
import { useTaskStore } from '@/store/tasks';

type ScheduleRow =
  | { kind: 'task'; id: string; start: string; task: Task }
  | { kind: 'google'; id: string; start: string; item: GoogleScheduleItem };

export default function CalendarScreen() {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const weekStartsOn = usePreferencesStore((state) => state.prefs.weekStartsOn);
  const timeFormat = usePreferencesStore((state) => state.prefs.timeFormat);
  const accent = accentById(usePreferencesStore((state) => state.prefs.accent)).color;
  const [selected, setSelected] = useState(() => new Date());
  const [googleAccount, setGoogleAccount] = useState<string | null>(null);
  const [googleItems, setGoogleItems] = useState<GoogleScheduleItem[]>([]);
  const [connecting, setConnecting] = useState(false);

  const weekStart = useMemo(() => startOfWeek(selected, weekStartsOn), [selected, weekStartsOn]);
  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        return date;
      }),
    [weekStart],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      readCalendarLink().then((link) => {
        if (active) setGoogleAccount(link?.account ?? null);
      });
      googleEventsOn(selected)
        .then((items) => {
          if (active) setGoogleItems(items);
        })
        .catch(() => {
          if (active) setGoogleItems([]);
        });
      return () => {
        active = false;
      };
    }, [selected]),
  );

  const selectedKey = toDateKey(selected);
  const rows = useMemo(() => {
    const local: ScheduleRow[] = tasks
      .filter((task) => task.scheduled && task.date === selectedKey)
      .map((task) => ({ kind: 'task', id: task.id, start: task.start, task }));
    const remote: ScheduleRow[] = googleItems.map((item) => ({ kind: 'google', id: item.id, start: item.start, item }));
    return [...local, ...remote].sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
  }, [googleItems, selectedKey, tasks]);
  const timeline = useMemo(() => buildTimeline(rows), [rows]);

  async function connectCalendar() {
    if (connecting) return;
    let granted = false;
    try {
      granted = await calendarAccessGranted();
    } catch {
      granted = false;
    }
    const consent = granted || (await confirmCalendarAccess());
    if (!consent) return;

    setConnecting(true);
    try {
      const link = await connectGoogleCalendar(true);
      await pullGoogleEvents((incoming) => useTaskStore.getState().importTasks(incoming));
      await syncAllTasks(useTaskStore.getState().tasks);
      setGoogleAccount(link.account);
      setGoogleItems(await googleEventsOn(selected));
    } catch (error) {
      Alert.alert(text.googleCalendar, error instanceof Error ? error.message : text.googleConnectFailed);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + Layout.tabClearance,
          paddingHorizontal: Layout.padding,
        }}>
        <View style={styles.header}>
          <IconButton icon="back" accessibilityLabel={text.backHome} onPress={() => router.navigate('/')} />
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={googleAccount ? fill(text.syncGoogle, { account: googleAccount }) : text.connectGoogle}
              disabled={connecting}
              onPress={() => void connectCalendar()}
              style={({ pressed }) => [styles.google, (pressed || connecting) && styles.googlePressed]}>
              <GoogleMark />
            </Pressable>
          </View>
          <View pointerEvents="none" style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{text.taskSchedule.replace(/\n/g, ' ')}</Text>
          </View>
        </View>

        <View style={styles.week}>
          {week.map((date) => {
            const key = toDateKey(date);
            const active = key === selectedKey;
            return (
              <Pressable key={key} onPress={() => setSelected(date)} style={styles.day}>
                <View style={[styles.dayNumber, active && styles.dayNumberActive]}>
                  <Text style={[styles.dayName, active && styles.dayNameActive]}>{formatWeekday(date)}</Text>
                  <Text style={[styles.dayNumberText, active && styles.dayNumberTextActive]}>{date.getDate()}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {timeline.length === 0 ? (
          <EmptyState
            icon="calendar"
            title={text.nothingScheduledTitle}
            body={text.nothingScheduledBody}
            actionLabel={text.addTask}
            onAction={() => router.push('/add-task')}
            style={styles.empty}
          />
        ) : (
          <View style={styles.timeline}>
            {timeline.map((slot) => (
              <View key={slot.hour} style={styles.slot}>
                <Text style={styles.slotTime}>{formatClock(`${String(slot.hour).padStart(2, '0')}:00`, timeFormat)}</Text>
                <View style={styles.slotBody}>
                  {slot.create ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={text.addNewTask}
                      onPress={() => router.push('/add-task')}
                      style={({ pressed }) => [styles.create, pressed && styles.pressed]}>
                      <Text style={styles.createText}>{text.addNewTask}</Text>
                      <Icon name="plus" size={18} color={Palette.ink} />
                    </Pressable>
                  ) : slot.items.length === 0 ? (
                    <View style={styles.slotLine} />
                  ) : (
                    slot.items.map((row) =>
                      row.kind === 'task' ? (
                        <ScheduleBlock key={row.id} task={row.task} accent={accent} timeFormat={timeFormat} text={text} />
                      ) : (
                        <ScheduleBlock
                          key={row.id}
                          accent={accent}
                          timeFormat={timeFormat}
                          text={text}
                          title={row.item.title}
                          start={row.item.start}
                          meta={text.googleCalendar}
                        />
                      ),
                    )
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function confirmCalendarAccess() {
  const text = getCopy();
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      text.googleCalendar,
      text.googleConsent,
      [
        { text: text.notNow, style: 'cancel', onPress: () => resolve(false) },
        { text: text.confirm, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

function ScheduleBlock({
  task,
  title,
  start,
  meta,
  accent,
  timeFormat,
  text,
}: {
  task?: Task;
  title?: string;
  start?: string;
  meta?: string;
  accent: string;
  timeFormat: '12' | '24';
  text: ReturnType<typeof useCopy>;
}) {
  const name = task?.title ?? title ?? '';
  const clock = task?.start ?? start ?? '';
  const detail =
    meta ??
    [
      task?.project.trim(),
      task?.kind === 'meeting' ? text.meet : task?.category === 'personal' ? text.categoryPersonal : text.work,
      task ? durationLabel(task.start, task.end, text.minutes) : '',
    ]
      .filter(Boolean)
      .join(' · ');

  const body = (
    <>
      <View style={[styles.blockBar, { backgroundColor: accent }]} />
      <View style={styles.blockCopy}>
        <Text style={styles.blockTime}>{formatClock(clock, timeFormat)}</Text>
        <Text style={styles.blockTitle} numberOfLines={2}>
          {name}
        </Text>
        {detail ? (
          <Text style={styles.blockMeta} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
    </>
  );

  if (!task) return <View style={styles.block}>{body}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={fill(text.editNamed, { name })}
      onPress={() => router.push({ pathname: '/add-task', params: { id: task.id } })}
      style={({ pressed }) => [styles.block, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

function buildTimeline(rows: ScheduleRow[]) {
  if (rows.length === 0) return [];
  const byHour = new Map<number, ScheduleRow[]>();
  for (const row of rows) {
    const hour = Number(row.start.slice(0, 2));
    const items = byHour.get(hour) ?? [];
    items.push(row);
    byHour.set(hour, items);
  }
  const hours = [...byHour.keys()];
  const first = Math.min(...hours);
  const last = Math.max(...hours);
  let createAt = last < 23 ? last + 1 : first;
  for (let hour = first; hour <= last; hour += 1) {
    if (!byHour.has(hour)) {
      createAt = hour;
      break;
    }
  }
  const slots = [];
  for (let hour = first; hour <= Math.max(last, createAt); hour += 1) {
    const items = byHour.get(hour) ?? [];
    slots.push({ hour, items, create: hour === createAt && items.length === 0 });
  }
  return slots;
}

function durationLabel(start: string, end: string, minutes: string) {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const span = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return span > 0 ? `${span} ${minutes}` : '';
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  header: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  google: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  googlePressed: {
    opacity: 0.72,
  },
  headerTitleWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
  },
  week: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    flex: 1,
  },
  dayNumber: {
    width: 46,
    height: 58,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E4E0E8',
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayNumberActive: {
    backgroundColor: Palette.ink,
    borderColor: Palette.ink,
  },
  dayName: {
    color: Palette.muted,
    fontSize: 11,
    fontWeight: 600,
  },
  dayNameActive: {
    color: 'rgba(255,255,255,0.72)',
  },
  dayNumberText: {
    color: Palette.ink,
    fontSize: 15,
    fontWeight: 700,
  },
  dayNumberTextActive: {
    color: Palette.white,
  },
  timeline: {
    marginTop: 26,
    gap: 16,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  slotTime: {
    width: 68,
    paddingTop: 14,
    color: Palette.muted,
    fontSize: 12,
    fontWeight: 700,
  },
  slotBody: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    gap: 8,
  },
  slotLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#DDD8E2',
    marginTop: 20,
  },
  create: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#F1F1F4',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createText: {
    color: Palette.ink,
    fontSize: 15,
    fontWeight: 700,
  },
  block: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Palette.ink,
    borderRadius: 16,
    overflow: 'hidden',
  },
  blockBar: {
    width: 4,
  },
  blockCopy: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 2,
  },
  blockTime: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: 700,
  },
  blockTitle: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: -0.2,
  },
  blockMeta: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: 600,
  },
  pressed: {
    opacity: 0.82,
  },
  empty: {
    marginTop: 24,
  },
});
