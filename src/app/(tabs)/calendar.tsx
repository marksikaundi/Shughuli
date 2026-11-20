import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Icon, IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import {
  formatClock,
  periodOf,
  splitClock,
  startOfWeek,
  toDateKey,
  useTasks,
  type Task,
  type TaskCategory,
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
import { formatScheduleDay, formatWeekday } from '@/i18n/format';
import { fill, getCopy, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';
import { useTaskStore } from '@/store/tasks';

type Filter = 'all' | TaskCategory | 'todo';

export default function CalendarScreen() {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const weekStartsOn = usePreferencesStore((state) => state.prefs.weekStartsOn);
  const timeFormat = usePreferencesStore((state) => state.prefs.timeFormat);
  const [selected, setSelected] = useState(() => new Date());
  const [filter, setFilter] = useState<Filter>('all');
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
  const events = useMemo(() => {
    return tasks
      .filter((task) => task.scheduled && task.date === selectedKey)
      .filter((task) => {
        if (filter === 'all') return true;
        if (filter === 'todo') return task.status === 'todo';
        return task.category === filter;
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [filter, selectedKey, tasks]);

  const rows = useMemo(() => {
    const local = events.map((task) => ({ kind: 'task' as const, id: task.id, start: task.start, task }));
    const remote =
      filter === 'all'
        ? googleItems.map((item) => ({ kind: 'google' as const, id: item.id, start: item.start, item }))
        : [];
    return [...local, ...remote].sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
  }, [events, filter, googleItems]);

  const periods = [
    { id: 'Morning' as const, label: text.morning },
    { id: 'Afternoon' as const, label: text.afternoon },
    { id: 'Evening' as const, label: text.evening },
  ];
  const groups = periods
    .map((period) => ({
      ...period,
      items: rows.filter((row) => periodOf(row.start) === period.id),
    }))
    .filter((group) => group.items.length > 0);

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

  const headerDate = formatScheduleDay(selected);
  const showingToday = selectedKey === toDateKey(new Date());

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
            <IconButton
              icon="plus"
              variant="dark"
              accessibilityLabel={text.addTask}
              onPress={() => router.push('/add-task')}
            />
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
            <Text style={styles.headerTitle}>{headerDate}</Text>
          </View>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>{text.taskSchedule}</Text>
          <View style={styles.calendarPill}>
            <Icon name="calendar" size={16} color={Palette.ink} />
            <Text style={styles.calendarPillText}>{text.tabCalendar}</Text>
          </View>
        </View>

        <View style={styles.week}>
          {week.map((date) => {
            const key = toDateKey(date);
            const active = key === selectedKey;
            return (
              <Pressable key={key} onPress={() => setSelected(date)} style={styles.day}>
                <Text style={[styles.dayName, active && styles.dayNameActive]}>
                  {formatWeekday(date)}
                </Text>
                <View style={[styles.dayNumber, active && styles.dayNumberActive]}>
                  <Text style={[styles.dayNumberText, active && styles.dayNumberTextActive]}>{date.getDate()}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <FilterPill label={text.all} icon={null} selected={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterPill
            label={text.work}
            icon="briefcase"
            selected={filter === 'work'}
            onPress={() => setFilter('work')}
          />
          <FilterPill
            label={text.categoryPersonal}
            icon="person"
            selected={filter === 'personal'}
            onPress={() => setFilter('personal')}
          />
          <FilterPill
            label={text.todo}
            icon="check"
            selected={filter === 'todo'}
            onPress={() => setFilter('todo')}
          />
        </ScrollView>

        {groups.length === 0 ? (
          <EmptyState
            icon="calendar"
            title={text.nothingScheduledTitle}
            body={text.nothingScheduledBody}
            actionLabel={text.addTask}
            onAction={() => router.push('/add-task')}
            style={styles.empty}
          />
        ) : (
          groups.map((group, groupIndex) => (
            <View key={group.id} style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={styles.groupTitle}>
                  <Icon name={group.id === 'Evening' ? 'moon' : 'sun'} size={16} color={Palette.ink} />
                  <Text style={styles.groupLabel}>{group.label}</Text>
                </View>
                {groupIndex === 0 ? <Text style={styles.today}>{showingToday ? text.today : headerDate}</Text> : null}
              </View>
              {group.items.map((row, index) =>
                row.kind === 'task' ? (
                  <ScheduleCard key={row.id} task={row.task} last={index === group.items.length - 1} timeFormat={timeFormat} text={text} />
                ) : (
                  <GoogleCard key={row.id} item={row.item} last={index === group.items.length - 1} timeFormat={timeFormat} />
                ),
              )}
            </View>
          ))
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

function GoogleCard({ item, last, timeFormat }: { item: GoogleScheduleItem; last: boolean; timeFormat: '12' | '24' }) {
  const clock = splitClock(item.start, timeFormat);

  return (
    <View style={styles.event}>
      <View style={styles.timeCol}>
        <Text style={styles.timeHour}>{clock.time}</Text>
        {clock.suffix ? <Text style={styles.timeSuffix}>{clock.suffix}</Text> : null}
      </View>
      <View style={styles.rail}>
        <View style={styles.railDot} />
        {last ? null : <View style={styles.railLine} />}
      </View>
      <View style={styles.eventCard}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <View style={styles.rangeRow}>
          <Icon name="clock" size={13} color={Palette.muted} />
          <Text style={styles.range}>
            {formatClock(item.start, timeFormat)} - {formatClock(item.end, timeFormat)}
          </Text>
        </View>
        <View style={styles.eventFooter}>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>Google</Text>
          </View>
        </View>
      </View>
    </View>
  );
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

function FilterPill({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: 'briefcase' | 'person' | 'check' | null;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, selected && styles.pillSelected]}>
      {icon ? <Icon name={icon} size={14} color={selected ? Palette.white : Palette.ink} /> : null}
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function ScheduleCard({
  task,
  last,
  timeFormat,
  text,
}: {
  task: Task;
  last: boolean;
  timeFormat: '12' | '24';
  text: ReturnType<typeof useCopy>;
}) {
  const clock = splitClock(task.start, timeFormat);

  return (
    <View style={styles.event}>
      <View style={styles.timeCol}>
        <Text style={styles.timeHour}>{clock.time}</Text>
        {clock.suffix ? <Text style={styles.timeSuffix}>{clock.suffix}</Text> : null}
      </View>
      <View style={styles.rail}>
        <View style={styles.railDot} />
        {last ? null : <View style={styles.railLine} />}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fill(text.editNamed, { name: task.title })}
        onPress={() => router.push({ pathname: '/add-task', params: { id: task.id } })}
        style={styles.eventCard}>
        <Text style={styles.eventTitle}>{task.title}</Text>
        {task.kind === 'meeting' ? (
          <Text style={styles.eventBody}>{task.description}</Text>
        ) : (
          <View style={styles.rangeRow}>
            <Icon name="clock" size={13} color={Palette.muted} />
            <Text style={styles.range}>
              {formatClock(task.start, timeFormat)} - {formatClock(task.end, timeFormat)}
            </Text>
          </View>
        )}
        <View style={styles.eventFooter}>
          {task.kind === 'meeting' ? (
            <View style={styles.meet}>
              <Icon name="video" size={13} color={Palette.white} />
              <Text style={styles.meetText}>{text.meet}</Text>
            </View>
          ) : (
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{task.status === 'in_progress' ? text.inProgress : text.scheduled}</Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
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
  titleRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: {
    color: Palette.ink,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  calendarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    ...cardShadow,
    shadowOpacity: 0.05,
  },
  calendarPillText: {
    color: Palette.ink,
    fontSize: 13,
    fontWeight: 600,
  },
  week: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dayName: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: 600,
  },
  dayNameActive: {
    color: Palette.ink,
  },
  dayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberActive: {
    backgroundColor: Palette.ink,
  },
  dayNumberText: {
    color: Palette.ink,
    fontSize: 15,
    fontWeight: 700,
  },
  dayNumberTextActive: {
    color: Palette.white,
  },
  filters: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 38,
    ...cardShadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  pillSelected: {
    backgroundColor: Palette.ink,
  },
  pillText: {
    color: Palette.ink,
    fontSize: 14,
    fontWeight: 600,
  },
  pillTextSelected: {
    color: Palette.white,
  },
  group: {
    marginTop: 22,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  groupTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupLabel: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
  },
  today: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 600,
  },
  event: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timeCol: {
    width: 48,
    alignItems: 'flex-end',
    paddingTop: 14,
  },
  timeHour: {
    color: Palette.ink,
    fontSize: 13,
    fontWeight: 700,
  },
  timeSuffix: {
    color: Palette.muted,
    fontSize: 11,
    fontWeight: 600,
  },
  rail: {
    width: 22,
    alignItems: 'center',
  },
  railDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.ink,
    marginTop: 18,
  },
  railLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#DDD8E2',
    marginTop: 4,
  },
  eventCard: {
    flex: 1,
    backgroundColor: Palette.white,
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
    ...cardShadow,
  },
  eventTitle: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: -0.2,
  },
  eventBody: {
    marginTop: 6,
    color: Palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  rangeRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  range: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: 500,
  },
  eventFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  meet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.blue,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  meetText: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: 700,
  },
  statusPill: {
    backgroundColor: Palette.review,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: Palette.reviewText,
    fontSize: 12,
    fontWeight: 700,
  },
  empty: {
    marginTop: 24,
  },
});
