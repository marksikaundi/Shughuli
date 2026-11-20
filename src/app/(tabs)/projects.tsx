import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { accentById } from '@/data/preferences';
import { toDateKey, useTasks, type Priority, type Task } from '@/data/tasks';
import { formatScheduleDay } from '@/i18n/format';
import { fill, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

type List = 'open' | 'done' | 'all';

const LISTS: List[] = ['open', 'done', 'all'];

const PRIORITY_COLOR: Record<Priority, string> = {
  high: Palette.high,
  medium: Palette.medium,
  low: Palette.low,
};

export default function TodoScreen() {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks, addTask, setTaskStatus } = useTasks();
  const defaultPriority = usePreferencesStore((state) => state.prefs.defaultPriority);
  const planningStart = usePreferencesStore((state) => state.prefs.planningStart);
  const accent = accentById(usePreferencesStore((state) => state.prefs.accent));
  const markColor = inkOn(accent.color);
  const [list, setList] = useState<List>('open');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const today = toDateKey(new Date());
  const tomorrow = shiftDate(today, 1);
  const yesterday = shiftDate(today, -1);

  const todos = useMemo(() => tasks.filter((task) => task.kind === 'task').sort(bySchedule), [tasks]);
  const openCount = todos.filter((task) => task.status !== 'done').length;
  const doneCount = todos.length - openCount;
  const progress = todos.length === 0 ? 0 : doneCount / todos.length;
  const visible = todos.filter((task) => {
    if (list === 'open') return task.status !== 'done';
    if (list === 'done') return task.status === 'done';
    return true;
  });
  const sections = useMemo(
    () => groupTodos(visible, { today, tomorrow, yesterday, todayLabel: text.today, tomorrowLabel: text.tomorrow, yesterdayLabel: text.yesterday }),
    [visible, today, tomorrow, yesterday, text.today, text.tomorrow, text.yesterday],
  );

  async function addTodo() {
    const title = draft.trim();
    if (!title || saving) {
      if (!title) Alert.alert(text.todo, text.addTaskTitleError);
      return;
    }
    setSaving(true);
    try {
      await addTask({
        title,
        description: '',
        date: today,
        start: planningStart,
        priority: defaultPriority,
        project: '',
        tags: [],
      });
      setDraft('');
    } catch (error) {
      Alert.alert(text.todo, error instanceof Error ? error.message : text.couldNotSaveTask);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(task: Task) {
    if (pendingId) return;
    setPendingId(task.id);
    try {
      await setTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done');
    } catch (error) {
      Alert.alert(text.todo, error instanceof Error ? error.message : text.couldNotSaveTask);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + Layout.tabClearance,
          paddingHorizontal: Layout.padding,
        }}>
        <Text style={styles.title}>{text.todo}</Text>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryValue}>{openCount}</Text>
              <Text style={styles.summaryLabel}>{text.pendingTask}</Text>
            </View>
            <View style={styles.summaryDone}>
              <Text style={styles.summaryValue}>{doneCount}</Text>
              <Text style={styles.summaryLabel}>{text.completedTask}</Text>
            </View>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: accent.color }]} />
          </View>
        </View>

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => void addTodo()}
            placeholder={text.taskTitlePlaceholder}
            placeholderTextColor={Palette.faint}
            returnKeyType="done"
            editable={!saving}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.addTask}
            disabled={saving}
            onPress={() => void addTodo()}
            style={({ pressed }) => [
              styles.add,
              { backgroundColor: accent.color },
              pressed && styles.pressed,
              saving && styles.disabled,
            ]}>
            <Icon name="plus" size={20} color={markColor} />
          </Pressable>
        </View>

        <View style={styles.filters}>
          {LISTS.map((id) => {
            const selected = list === id;
            const label = id === 'open' ? text.todo : id === 'done' ? text.done : text.all;
            const count = id === 'open' ? openCount : id === 'done' ? doneCount : todos.length;
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setList(id)}
                style={[styles.chip, selected && styles.chipOn]}>
                <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
                <Text style={[styles.chipCount, selected && styles.chipTextOn]}>{count}</Text>
              </Pressable>
            );
          })}
        </View>

        {todos.length === 0 ? (
          <EmptyState icon="check" title={text.noTasksYet} body={text.noTasksBody} style={styles.empty} />
        ) : visible.length === 0 ? (
          <EmptyState
            compact
            icon="check"
            title={list === 'done' ? text.nothingFinishedTitle : text.allDone}
            body={list === 'done' ? text.nothingFinishedBody : text.noTasksBody}
            style={styles.empty}
          />
        ) : (
          sections.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.label}</Text>
              <View style={styles.stack}>
                {section.items.map((task) => {
                  const done = task.status === 'done';
                  return (
                    <View key={task.id} style={[styles.card, done && styles.cardDone]}>
                      <View style={[styles.stripe, { backgroundColor: PRIORITY_COLOR[task.priority] }]} />
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: done, disabled: pendingId === task.id }}
                        accessibilityLabel={task.title}
                        disabled={pendingId === task.id}
                        onPress={() => void toggle(task)}
                        hitSlop={8}
                        style={[styles.box, done && { backgroundColor: accent.color, borderColor: accent.color }]}>
                        {done ? <Icon name="check" size={14} color={markColor} /> : null}
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={fill(text.editNamed, { name: task.title })}
                        onPress={() => router.push({ pathname: '/add-task', params: { id: task.id } })}
                        style={styles.copy}>
                        <Text style={[styles.taskTitle, done && styles.taskDone]} numberOfLines={2}>
                          {task.title}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function groupTodos(
  tasks: Task[],
  labels: {
    today: string;
    tomorrow: string;
    yesterday: string;
    todayLabel: string;
    tomorrowLabel: string;
    yesterdayLabel: string;
  },
) {
  const groups: { key: string; label: string; items: Task[] }[] = [];
  for (const task of tasks) {
    const label =
      task.date === labels.today
        ? labels.todayLabel
        : task.date === labels.tomorrow
          ? labels.tomorrowLabel
          : task.date === labels.yesterday
            ? labels.yesterdayLabel
            : formatScheduleDay(dateFromKey(task.date));
    const key = `${task.status === 'done' ? 'done' : 'open'}:${task.date}`;
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(task);
    else groups.push({ key, label, items: [task] });
  }
  return groups;
}

function bySchedule(a: Task, b: Task) {
  const aDone = a.status === 'done' ? 1 : 0;
  const bDone = b.status === 'done' ? 1 : 0;
  return aDone - bDone || a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.title.localeCompare(b.title);
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function shiftDate(key: string, days: number) {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function inkOn(hex: string) {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72 ? Palette.ink : Palette.white;
}

const styles = StyleSheet.create({
  title: {
    color: Palette.ink,
    fontSize: 40,
    fontWeight: 700,
    letterSpacing: -1.2,
  },
  summary: {
    marginTop: 18,
    backgroundColor: Palette.white,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    ...cardShadow,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  summaryDone: {
    alignItems: 'flex-end',
  },
  summaryValue: {
    color: Palette.ink,
    fontSize: 36,
    fontWeight: 700,
    letterSpacing: -1,
  },
  summaryLabel: {
    marginTop: 2,
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 700,
  },
  track: {
    marginTop: 16,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1EDF3',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  composer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.white,
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 6,
    minHeight: 60,
    ...cardShadow,
    shadowOpacity: 0.05,
  },
  input: {
    flex: 1,
    minHeight: 48,
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 600,
  },
  add: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  chipOn: {
    backgroundColor: Palette.ink,
  },
  chipText: {
    color: Palette.ink,
    fontSize: 14,
    fontWeight: 700,
  },
  chipCount: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 700,
  },
  chipTextOn: {
    color: Palette.white,
  },
  empty: {
    marginTop: 18,
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    marginBottom: 10,
    marginLeft: 4,
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  stack: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
    paddingRight: 14,
    backgroundColor: Palette.white,
    borderRadius: 22,
    overflow: 'hidden',
    ...cardShadow,
    shadowOpacity: 0.05,
    shadowRadius: 14,
  },
  cardDone: {
    opacity: 0.72,
  },
  stripe: {
    width: 6,
    alignSelf: 'stretch',
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#C8C4CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    paddingVertical: 14,
  },
  taskTitle: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: -0.2,
  },
  taskDone: {
    color: Palette.muted,
    textDecorationLine: 'line-through',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});
