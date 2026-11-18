import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarStack } from '@/components/avatar-stack';
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

type Filter = 'all' | TaskCategory;

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const [selected, setSelected] = useState(() => new Date());
  const [filter, setFilter] = useState<Filter>('all');
  const [starredOnly, setStarredOnly] = useState(false);

  const weekStart = useMemo(() => startOfWeek(selected), [selected]);
  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        return date;
      }),
    [weekStart],
  );

  const selectedKey = toDateKey(selected);
  const events = useMemo(() => {
    return tasks
      .filter((task) => task.scheduled && task.date === selectedKey)
      .filter((task) => (filter === 'all' ? true : task.category === filter))
      .filter((task) => (starredOnly ? task.starred : true))
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [filter, selectedKey, starredOnly, tasks]);

  const groups = ['Morning', 'Afternoon', 'Evening']
    .map((label) => ({
      label,
      items: events.filter((task) => periodOf(task.start) === label),
    }))
    .filter((group) => group.items.length > 0);

  const headerDate = selected.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  });
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
          <IconButton icon="back" accessibilityLabel="Back to home" onPress={() => router.navigate('/')} />
          <View style={styles.headerActions}>
            <IconButton
              icon="plus"
              variant="dark"
              accessibilityLabel="Add task"
              onPress={() => router.push('/add-task')}
            />
            <IconButton icon="more" accessibilityLabel="More options" />
          </View>
          <View pointerEvents="none" style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{headerDate}</Text>
          </View>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>{'Task\nSchedule'}</Text>
          <View style={styles.calendarPill}>
            <Icon name="calendar" size={16} color={Palette.ink} />
            <Text style={styles.calendarPillText}>Calendar</Text>
          </View>
        </View>

        <View style={styles.week}>
          {week.map((date) => {
            const key = toDateKey(date);
            const active = key === selectedKey;
            return (
              <Pressable key={key} onPress={() => setSelected(date)} style={styles.day}>
                <Text style={[styles.dayName, active && styles.dayNameActive]}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <View style={[styles.dayNumber, active && styles.dayNumberActive]}>
                  <Text style={[styles.dayNumberText, active && styles.dayNumberTextActive]}>{date.getDate()}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.filters}>
          <FilterPill label="All" icon={null} selected={filter === 'all' && !starredOnly} onPress={() => {
            setFilter('all');
            setStarredOnly(false);
          }} />
          <FilterPill
            label="Work"
            icon="briefcase"
            selected={filter === 'work'}
            onPress={() => setFilter('work')}
          />
          <FilterPill
            label="Personal"
            icon="person"
            selected={filter === 'personal'}
            onPress={() => setFilter('personal')}
          />
          <Pressable
            accessibilityLabel="Starred tasks"
            onPress={() => setStarredOnly((value) => !value)}
            style={[styles.star, starredOnly && styles.starActive]}>
            <Icon name={starredOnly ? 'starFill' : 'star'} size={16} color={starredOnly ? Palette.white : Palette.ink} />
          </Pressable>
        </View>

        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing scheduled</Text>
            <Text style={styles.emptyBody}>This day is open. Add a task to put it on the timeline.</Text>
          </View>
        ) : (
          groups.map((group, groupIndex) => (
            <View key={group.label} style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={styles.groupTitle}>
                  <Icon name={group.label === 'Evening' ? 'moon' : 'sun'} size={16} color={Palette.ink} />
                  <Text style={styles.groupLabel}>{group.label}</Text>
                </View>
                {groupIndex === 0 ? <Text style={styles.today}>{showingToday ? 'Today' : headerDate}</Text> : null}
              </View>
              {group.items.map((task, index) => (
                <ScheduleCard key={task.id} task={task} last={index === group.items.length - 1} />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function FilterPill({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: 'briefcase' | 'person' | null;
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

function ScheduleCard({ task, last }: { task: Task; last: boolean }) {
  const clock = splitClock(task.start);

  return (
    <View style={styles.event}>
      <View style={styles.timeCol}>
        <Text style={styles.timeHour}>{clock.time}</Text>
        <Text style={styles.timeSuffix}>{clock.suffix}</Text>
      </View>
      <View style={styles.rail}>
        <View style={styles.railDot} />
        {last ? null : <View style={styles.railLine} />}
      </View>
      <View style={styles.eventCard}>
        <Text style={styles.eventTitle}>{task.title}</Text>
        {task.kind === 'meeting' ? (
          <Text style={styles.eventBody}>{task.description}</Text>
        ) : (
          <View style={styles.rangeRow}>
            <Icon name="clock" size={13} color={Palette.muted} />
            <Text style={styles.range}>
              {formatClock(task.start)} - {formatClock(task.end)}
            </Text>
          </View>
        )}
        <View style={styles.eventFooter}>
          <AvatarStack ids={task.people} extra={task.extraPeople} size={26} />
          {task.kind === 'meeting' ? (
            <View style={styles.meet}>
              <Icon name="video" size={13} color={Palette.white} />
              <Text style={styles.meetText}>Meet</Text>
            </View>
          ) : (
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{task.status === 'in_progress' ? 'In Progress' : 'Scheduled'}</Text>
            </View>
          )}
        </View>
      </View>
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
    gap: 10,
  },
  headerTitleWrap: {
    ...StyleSheet.absoluteFillObject,
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
  star: {
    marginLeft: 'auto',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
    shadowOpacity: 0.05,
  },
  starActive: {
    backgroundColor: Palette.ink,
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
    justifyContent: 'space-between',
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
    backgroundColor: Palette.white,
    borderRadius: 24,
    padding: 20,
    ...cardShadow,
  },
  emptyTitle: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
  },
  emptyBody: {
    marginTop: 4,
    color: Palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
