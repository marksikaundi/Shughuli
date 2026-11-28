import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { TodayMark } from '@/components/night-empty';
import { Screen, useNightStatus } from '@/components/screen';
import { TaskLine } from '@/components/task-line';
import { ActivitySheet, TodayDisplaySheet, defaultTodayDisplay, type TodayDisplay, type TodaySorting } from '@/components/today-display';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { startOfWeek, todayKey, useTasks, type Task } from '@/data/tasks';
import { formatLocale } from '@/i18n/format';
import type { WeekStart } from '@/lib/runtime-prefs';
import { fill, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export default function TodayScreen() {
  useNightStatus();
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks, setTaskStatus } = useTasks();
  const weekStartsOn = usePreferencesStore((state) => state.prefs.weekStartsOn);
  const [display, setDisplay] = useState<TodayDisplay>(defaultTodayDisplay);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [activity, setActivity] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const today = todayKey();
  const heading = todayHeading(today);

  const todayTasks = useMemo(() => tasks.filter((task) => task.date === today), [tasks, today]);
  const items = useMemo(() => sortTasks(filterTasks(todayTasks, display, today), display.sorting), [display, today, todayTasks]);
  const groups = useMemo(
    () => groupTasks(items, display, { none: text.none, high: text.highPriority, medium: text.mediumPriority, low: text.lowPriority }),
    [display, items, text.highPriority, text.lowPriority, text.mediumPriority, text.none],
  );
  const countLabel = items.length === 1 ? fill(text.taskCountOne, { count: items.length }) : fill(text.taskCountOther, { count: items.length });

  async function toggle(task: Task) {
    if (pendingId) return;
    setPendingId(task.id);
    try {
      await setTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done');
    } catch (error) {
      Alert.alert(text.today, error instanceof Error ? error.message : text.couldNotSaveTask);
    } finally {
      setPendingId(null);
    }
  }

  function togglePicked(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function completePicked() {
    const ids = picked;
    setSelecting(false);
    setPicked([]);
    for (const id of ids) {
      const task = items.find((item) => item.id === id);
      if (task && task.status !== 'done') {
        try {
          await setTaskStatus(id, 'done');
        } catch (error) {
          Alert.alert(text.today, error instanceof Error ? error.message : text.couldNotSaveTask);
          return;
        }
      }
    }
  }

  async function copyLink() {
    setMenu(false);
    const link = 'shughuli://today';
    try {
      const clipboard = await import('expo-clipboard');
      await clipboard.setStringAsync(link);
      Alert.alert(text.linkCopied);
    } catch {
      await Share.share({ message: link });
    }
  }

  function open(task: Task) {
    router.push({ pathname: '/add-task', params: { id: task.id } });
  }

  return (
    <Screen tone="night">
      <View style={[styles.page, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + Layout.tabClearance }]}>
        <View style={styles.tools}>
          <View style={styles.pill}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.display}
              onPress={() => {
                setMenu(false);
                setDisplayOpen(true);
              }}
              style={[styles.iconButton, styles.iconButtonOn]}>
              <Icon name="viewList" size={18} color={Night.text} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.more}
              accessibilityState={{ expanded: menu }}
              onPress={() => setMenu((open) => !open)}
              style={styles.iconButton}>
              <Icon name="more" size={18} color={Night.text} />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.fill} contentContainerStyle={[styles.content, items.length === 0 && styles.contentEmpty]}>
          <Text style={styles.title}>{text.today}</Text>
          <Text style={styles.count}>{countLabel}</Text>
          {display.layout === 'calendar' ? <MonthGrid today={today} weekStartsOn={weekStartsOn} /> : <Text style={styles.dayLabel}>{heading}</Text>}

          {items.length === 0 ? (
            <View style={styles.empty}>
              <TodayMark />
              <Text style={styles.emptyTitle}>{text.todayPrompt}</Text>
              <Text style={styles.emptyBody}>{text.todayPromptBody}</Text>
            </View>
          ) : display.layout === 'board' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board}>
              {groups.map((group) => (
                <View key={group.id} style={styles.column}>
                  {group.title ? <Text style={styles.columnTitle}>{group.title}</Text> : null}
                  {group.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      picked={picked.includes(task.id)}
                      selecting={selecting}
                      busy={pendingId === task.id}
                      showMark={display.feedback === 'checkmark'}
                      onToggle={() => (selecting ? togglePicked(task.id) : void toggle(task))}
                      onOpen={() => (selecting ? togglePicked(task.id) : open(task))}
                    />
                  ))}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.list}>
              {groups.map((group) => (
                <View key={group.id}>
                  {group.title ? <Text style={styles.groupTitle}>{group.title}</Text> : null}
                  {group.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      picked={picked.includes(task.id)}
                      selecting={selecting}
                      busy={pendingId === task.id}
                      showMark={display.feedback === 'checkmark'}
                      onToggle={() => (selecting ? togglePicked(task.id) : void toggle(task))}
                      onOpen={() => (selecting ? togglePicked(task.id) : open(task))}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {selecting ? (
          <View style={styles.selectBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.close}
              onPress={() => {
                setSelecting(false);
                setPicked([]);
              }}
              style={styles.selectButton}>
              <Icon name="close" size={16} color={Night.text} />
            </Pressable>
            <Text style={styles.selectCount}>{fill(text.selectedTasks, { count: picked.length })}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.completeSelected}
              disabled={picked.length === 0}
              onPress={() => void completePicked()}
              style={[styles.selectButton, styles.selectDone, picked.length === 0 && styles.selectOff]}>
              <Icon name="check" size={16} color={Night.text} />
            </Pressable>
          </View>
        ) : null}

        {menu ? <Pressable accessibilityRole="button" accessibilityLabel={text.close} onPress={() => setMenu(false)} style={styles.backdrop} /> : null}
        {menu ? (
          <View style={styles.menu}>
            <MenuRow icon="link" label={text.copyLinkToday} onPress={() => void copyLink()} />
            <View style={styles.menuLine} />
            <MenuRow
              icon="select"
              label={text.selectTasks}
              onPress={() => {
                setMenu(false);
                setPicked([]);
                setSelecting(true);
              }}
            />
            <View style={styles.menuLine} />
            <MenuRow
              icon="wave"
              label={text.viewActivity}
              onPress={() => {
                setMenu(false);
                setActivity(true);
              }}
            />
          </View>
        ) : null}
      </View>

      {displayOpen ? (
        <TodayDisplaySheet
          value={display}
          onClose={() => setDisplayOpen(false)}
          onSave={(next) => {
            setDisplay(next);
            setDisplayOpen(false);
          }}
        />
      ) : null}
      {activity ? <ActivitySheet tasks={todayTasks} onClose={() => setActivity(false)} /> : null}
    </Screen>
  );
}

function TaskRow({
  task,
  picked,
  selecting,
  busy,
  showMark,
  onToggle,
  onOpen,
}: {
  task: Task;
  picked: boolean;
  selecting: boolean;
  busy: boolean;
  showMark: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <View style={picked && selecting ? styles.picked : null}>
      <TaskLine agenda task={task} busy={busy} showMark={showMark} onToggle={onToggle} onOpen={onOpen} />
    </View>
  );
}

function MenuRow({ icon, label, onPress }: { icon: 'link' | 'select' | 'wave'; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.menuRow}>
      <Icon name={icon} size={20} color={Night.text} />
      <Text style={styles.menuLabel}>{label}</Text>
    </Pressable>
  );
}

function MonthGrid({ today, weekStartsOn }: { today: string; weekStartsOn: WeekStart }) {
  const [year, month, day] = today.split('-').map(Number);
  const first = new Date(year, (month || 1) - 1, 1);
  const lead = Math.round((first.getTime() - startOfWeek(first, weekStartsOn).getTime()) / 86400000);
  const count = new Date(year, month || 1, 0).getDate();
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() - lead + index);
    return date;
  });

  return (
    <View style={styles.month}>
      <Text style={styles.dayLabel}>{`${formatLocale(first, { month: 'short' })} ${year}`}</Text>
      <View style={styles.monthGrid}>
        {week.map((date) => (
          <Text key={date.toISOString()} style={styles.monthName}>
            {formatLocale(date, { weekday: 'narrow' }).slice(0, 1).toUpperCase()}
          </Text>
        ))}
        {Array.from({ length: lead }, (_, index) => (
          <View key={`blank-${index}`} style={styles.monthCell} />
        ))}
        {Array.from({ length: count }, (_, index) => {
          const active = index + 1 === day;
          return (
            <View key={index + 1} style={styles.monthCell}>
              <View style={[styles.monthNumber, active && styles.monthNumberOn]}>
                <Text style={styles.monthNumberText}>{index + 1}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function filterTasks(tasks: Task[], display: TodayDisplay, today: string) {
  return tasks.filter((task) => {
    if (!display.showCompleted && task.status === 'done') return false;
    if (display.priority !== 'all' && task.priority !== display.priority) return false;
    if (display.deadline === 'overdue') return task.date < today;
    if (display.deadline === 'today') return task.date === today;
    if (display.deadline === 'week') return task.date >= today && task.date <= shiftKey(today, 6);
    return true;
  });
}

function sortTasks(tasks: Task[], sorting: TodaySorting) {
  const next = [...tasks];
  if (sorting === 'name') return next.sort((a, b) => a.title.localeCompare(b.title));
  if (sorting === 'priority') return next.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.title.localeCompare(b.title));
  return next.sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}

function groupTasks(tasks: Task[], display: TodayDisplay, labels: { none: string; high: string; medium: string; low: string }) {
  if (display.layout !== 'board' && display.grouping === 'none') return [{ id: 'all', title: '', tasks }];
  const titles = { high: labels.high, medium: labels.medium, low: labels.low };
  return (['high', 'medium', 'low'] as const)
    .map((id) => ({ id, title: titles[id], tasks: tasks.filter((task) => task.priority === id) }))
    .filter((group) => display.layout === 'board' || group.tasks.length > 0);
}

function todayHeading(key: string) {
  const date = keyToDate(key);
  return `${date.getDate()} ${formatLocale(date, { month: 'short' })} · ${formatLocale(date, { weekday: 'long' })}`;
}

function keyToDate(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function shiftKey(key: string, days: number) {
  const date = keyToDate(key);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: Layout.padding,
  },
  fill: {
    flex: 1,
  },
  tools: {
    minHeight: 40,
    alignItems: 'flex-end',
  },
  pill: {
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A3A3A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  iconButton: {
    width: 34,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonOn: {
    backgroundColor: '#4A4A4A',
  },
  content: {
    paddingBottom: 24,
  },
  contentEmpty: {
    flexGrow: 1,
  },
  title: {
    marginTop: 18,
    color: Night.text,
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  count: {
    marginTop: 2,
    color: Night.muted,
    fontSize: 15,
    fontWeight: 500,
  },
  dayLabel: {
    marginTop: 22,
    color: Night.text,
    fontSize: 17,
    fontWeight: 700,
  },
  list: {
    marginTop: 4,
  },
  groupTitle: {
    marginTop: 16,
    color: Night.muted,
    fontSize: 13,
    fontWeight: 700,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  emptyTitle: {
    marginTop: 28,
    color: Night.text,
    fontSize: 20,
    fontWeight: 700,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 8,
    color: Night.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  board: {
    paddingTop: 16,
    gap: 12,
  },
  column: {
    width: 260,
    borderRadius: 16,
    backgroundColor: '#242424',
    padding: 12,
  },
  columnTitle: {
    marginBottom: 8,
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
  },
  picked: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
  },
  month: {
    marginTop: 8,
  },
  monthGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthName: {
    width: '14.28%',
    textAlign: 'center',
    color: '#8A8A8A',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 8,
  },
  monthCell: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: 6,
  },
  monthNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNumberOn: {
    backgroundColor: Night.accent,
  },
  monthNumberText: {
    color: Night.text,
    fontSize: 15,
    fontWeight: 600,
  },
  selectBar: {
    marginTop: 8,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#2C2C2C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  selectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectDone: {
    backgroundColor: Night.accent,
  },
  selectOff: {
    opacity: 0.4,
  },
  selectCount: {
    color: Night.text,
    fontSize: 15,
    fontWeight: 600,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  menu: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 250,
    borderRadius: 18,
    backgroundColor: '#3A3A3A',
    paddingVertical: 4,
  },
  menuRow: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuLabel: {
    color: Night.text,
    fontSize: 17,
    fontWeight: 500,
  },
  menuLine: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 50,
    backgroundColor: '#555555',
  },
});
