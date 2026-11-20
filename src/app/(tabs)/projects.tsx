import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { formatDate, toDateKey, useTasks, type Task } from '@/data/tasks';
import { countPhrase, fill, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

type List = 'open' | 'done' | 'all';

const LISTS: List[] = ['open', 'done', 'all'];

export default function TodoScreen() {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks, addTask, setTaskStatus } = useTasks();
  const defaultPriority = usePreferencesStore((state) => state.prefs.defaultPriority);
  const planningStart = usePreferencesStore((state) => state.prefs.planningStart);
  const dateFormat = usePreferencesStore((state) => state.prefs.dateFormat);
  const [list, setList] = useState<List>('open');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const today = toDateKey(new Date());

  const todos = useMemo(
    () => tasks.filter((task) => task.kind === 'task').sort(bySchedule),
    [tasks],
  );
  const openCount = todos.filter((task) => task.status !== 'done').length;
  const visible = todos.filter((task) => {
    if (list === 'open') return task.status !== 'done';
    if (list === 'done') return task.status === 'done';
    return true;
  });

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
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + Layout.tabClearance,
          paddingHorizontal: Layout.padding,
        }}>
        <View style={styles.header}>
          <Text style={styles.title}>{text.todo}</Text>
          {todos.length > 0 ? (
            <Text style={styles.subtitle}>
              {countPhrase(openCount, {
                one: text.openOne,
                few: text.openFew,
                many: text.openMany,
                other: text.openOther,
              })}
            </Text>
          ) : null}
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
            style={({ pressed }) => [styles.add, pressed && styles.pressed, saving && styles.disabled]}>
            <Icon name="plus" size={18} color={Palette.white} />
          </Pressable>
        </View>

        {todos.length === 0 ? (
          <EmptyState icon="check" title={text.noTasksYet} body={text.noTasksBody} style={styles.empty} />
        ) : (
          <>
            <View style={styles.segment}>
              {LISTS.map((id) => {
                const selected = list === id;
                const label = id === 'open' ? text.todo : id === 'done' ? text.done : text.all;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setList(id)}
                    style={[styles.segmentItem, selected && styles.segmentItemOn]}>
                    <Text style={[styles.segmentText, selected && styles.segmentTextOn]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {visible.length === 0 ? (
              <EmptyState
                compact
                icon="check"
                title={list === 'done' ? text.nothingFinishedTitle : text.allDone}
                body={list === 'done' ? text.nothingFinishedBody : text.noTasksBody}
                style={styles.empty}
              />
            ) : (
              <View style={styles.list}>
                {visible.map((task, index) => {
                  const done = task.status === 'done';
                  const when = task.date === today ? text.today : formatDate(dateFromKey(task.date), dateFormat);
                  return (
                    <View key={task.id} style={[styles.row, index > 0 && styles.rowLine]}>
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: done, disabled: pendingId === task.id }}
                        accessibilityLabel={task.title}
                        disabled={pendingId === task.id}
                        onPress={() => void toggle(task)}
                        hitSlop={8}
                        style={[styles.box, done && styles.boxOn]}>
                        {done ? <Icon name="check" size={14} color={Palette.white} /> : null}
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={fill(text.editNamed, { name: task.title })}
                        onPress={() => router.push({ pathname: '/add-task', params: { id: task.id } })}
                        style={styles.copy}>
                        <Text style={[styles.taskTitle, done && styles.taskDone]} numberOfLines={2}>
                          {task.title}
                        </Text>
                        <Text style={styles.when}>{when}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
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

const styles = StyleSheet.create({
  header: {
    paddingTop: 4,
  },
  title: {
    color: Palette.ink,
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 6,
    color: Palette.muted,
    fontSize: 15,
    fontWeight: 600,
  },
  composer: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.white,
    borderRadius: 20,
    padding: 6,
    paddingLeft: 16,
    ...cardShadow,
  },
  input: {
    flex: 1,
    minHeight: 44,
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 600,
  },
  add: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    marginTop: 22,
  },
  segment: {
    marginTop: 16,
    flexDirection: 'row',
    backgroundColor: Palette.white,
    borderRadius: 18,
    padding: 4,
    ...cardShadow,
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  segmentItem: {
    flex: 1,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemOn: {
    backgroundColor: Palette.ink,
  },
  segmentText: {
    color: Palette.muted,
    fontSize: 14,
    fontWeight: 700,
  },
  segmentTextOn: {
    color: Palette.white,
  },
  list: {
    marginTop: 16,
    backgroundColor: Palette.white,
    borderRadius: 24,
    paddingHorizontal: 16,
    ...cardShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
  },
  rowLine: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.line,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: Palette.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: Palette.ink,
    borderColor: Palette.ink,
  },
  copy: {
    flex: 1,
    paddingVertical: 12,
  },
  taskTitle: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
  },
  taskDone: {
    color: Palette.muted,
    textDecorationLine: 'line-through',
  },
  when: {
    marginTop: 2,
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 600,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});
