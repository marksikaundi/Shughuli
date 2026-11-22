import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateCalendarPopup, TimePopup } from '@/components/due-pickers';
import { Icon, IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { TaskEditor } from '@/components/task-editor';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { useProjects } from '@/data/projects';
import { formatClock, formatDate, todayKey, useTasks, type Priority, type Task } from '@/data/tasks';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

export default function AddTaskScreen() {
  const params = useLocalSearchParams<{ id?: string; project?: string; date?: string }>();
  const taskId = typeof params.id === 'string' ? params.id : undefined;
  const presetProject = typeof params.project === 'string' ? params.project : '';
  const presetDate = typeof params.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : '';
  const { tasks } = useTasks();
  const task = taskId ? tasks.find((item) => item.id === taskId) : undefined;

  if (taskId && !task) {
    return <MissingTask />;
  }

  if (task) return <TaskEditor key={task.id} task={task} />;

  return <TaskForm key={`new-${presetProject}-${presetDate}`} initialProject={presetProject} initialDate={presetDate} />;
}

function TaskForm({ task, initialProject = '', initialDate = '' }: { task?: Task; initialProject?: string; initialDate?: string }) {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { addTask, updateTask, deleteTask } = useTasks();
  const { projects } = useProjects();
  const defaultPriority = usePreferencesStore((state) => state.prefs.defaultPriority);
  const planningStart = usePreferencesStore((state) => state.prefs.planningStart);
  const duration = usePreferencesStore((state) => state.prefs.defaultDuration);
  const timeFormat = usePreferencesStore((state) => state.prefs.timeFormat);
  const dateFormat = usePreferencesStore((state) => state.prefs.dateFormat);
  const weekStartsOn = usePreferencesStore((state) => state.prefs.weekStartsOn);
  const editing = Boolean(task);
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? defaultPriority);
  const projectOptions = useMemo(() => {
    const names = projects.map((item) => item.name);
    const current = task?.project.trim() ?? '';
    if (current && !names.some((name) => name.toLowerCase() === current.toLowerCase())) {
      return [current, ...names];
    }
    return names;
  }, [projects, task?.project]);
  const preset = projectOptions.find((name) => name.toLowerCase() === initialProject.trim().toLowerCase()) ?? '';
  const [project, setProject] = useState(task?.project.trim() || preset);
  const [tags, setTags] = useState<string[]>(task?.tags ?? []);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(task?.date ?? (initialDate || todayKey()));
  const [start, setStart] = useState(task?.start ?? planningStart);
  const [scheduleOpen, setScheduleOpen] = useState<'date' | 'time' | null>(null);

  const dueLabel = dueDateLabel(date, dateFormat);

  function commitTag() {
    const next = tagDraft.trim();
    if (next && !tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
      setTags((current) => [...current, next]);
    }
    setTagDraft('');
    setAddingTag(false);
  }

  function leave() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  async function save() {
    if (busy) return;
    const nextTitle = title.trim();
    if (!nextTitle) {
      setError(text.addTaskTitleError);
      return;
    }
    const draft = {
      title: nextTitle,
      description: description.trim(),
      date,
      start,
      priority,
      project: project.trim(),
      tags,
    };
    setBusy(true);
    try {
      if (task) {
        await updateTask(task.id, draft);
      } else {
        await addTask(draft);
      }
      leave();
    } catch {
      setBusy(false);
      setError(text.couldNotSaveTask);
    }
  }

  function confirmDelete() {
    if (!task || busy) return;
    Alert.alert(text.deleteTaskTitle, text.deleteTaskBody, [
      { text: text.cancel, style: 'cancel' },
      {
        text: text.delete,
        style: 'destructive',
        onPress: () => {
          void remove();
        },
      },
    ]);
  }

  async function remove() {
    if (!task) return;
    setBusy(true);
    try {
      await deleteTask(task.id);
      leave();
    } catch {
      setBusy(false);
      setError(text.couldNotDeleteTask);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 28,
            paddingHorizontal: Layout.padding,
          }}>
          <View style={styles.header}>
            <IconButton icon="close" accessibilityLabel={text.close} onPress={leave} />
            <Text style={styles.headerTitle}>{editing ? text.editTask : text.addNewTask}</Text>
            <IconButton icon="check" accessibilityLabel={text.saveTask} onPress={save} />
          </View>

          <Field label={text.taskTitle}>
            <TextInput
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                if (error) setError('');
              }}
              placeholder={text.taskTitlePlaceholder}
              placeholderTextColor={Palette.faint}
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </Field>

          <Field label={text.description}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={text.descriptionPlaceholder}
              placeholderTextColor={Palette.faint}
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.multiline]}
            />
          </Field>

          <Field label={text.dueDateTime}>
            <View style={styles.dueRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={text.chooseDueDate}
                onPress={() => {
                  Keyboard.dismiss();
                  setScheduleOpen('date');
                }}
                style={({ pressed }) => [styles.input, styles.dueField, pressed && styles.pressed]}>
                <Icon name="calendar" size={16} color={Palette.ink} />
                <Text style={styles.dueText} numberOfLines={1}>
                  {dueLabel}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={text.chooseTime}
                onPress={() => {
                  Keyboard.dismiss();
                  setScheduleOpen('time');
                }}
                style={({ pressed }) => [styles.input, styles.timeField, pressed && styles.pressed]}>
                <Icon name="clock" size={16} color={Palette.ink} />
                <Text style={styles.dueText} numberOfLines={1}>
                  {formatClock(start, timeFormat)}
                  {editing ? '' : ` · ${duration} ${text.minutes}`}
                </Text>
              </Pressable>
            </View>
          </Field>

          <Field label={text.priority}>
            <View style={styles.priorities}>
              {PRIORITIES.map((id) => {
                const selected = priority === id;
                const label = id === 'low' ? text.low : id === 'medium' ? text.medium : text.high;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setPriority(id)}
                    style={[
                      styles.priority,
                      id === 'low' && styles.priorityLow,
                      id === 'medium' && styles.priorityMedium,
                      id === 'high' && styles.priorityHigh,
                      selected && styles.prioritySelected,
                    ]}>
                    <Text
                      style={[
                        styles.priorityText,
                        id === 'low' && styles.priorityLowText,
                        id === 'medium' && styles.priorityMediumText,
                        id === 'high' && styles.priorityHighText,
                      ]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label={text.project}>
            {projectOptions.length === 0 ? (
              <Text style={styles.projectHint}>{text.projectHint}</Text>
            ) : (
              <View style={styles.projects}>
                {projectOptions.map((name) => {
                  const selected = project.toLowerCase() === name.toLowerCase();
                  return (
                    <Pressable
                      key={name}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setProject(selected ? '' : name)}
                      style={[styles.projectChip, selected && styles.projectChipSelected]}>
                      <Icon name="folder" size={14} color={Palette.ink} />
                      <Text style={styles.projectChipText}>{name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Field>

          <Field label={text.tags}>
            <View style={styles.tags}>
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => setTags((current) => current.filter((item) => item !== tag))}
                  style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <Icon name="close" size={12} color={Palette.tagText} />
                </Pressable>
              ))}
              {addingTag ? (
                <TextInput
                  value={tagDraft}
                  onChangeText={setTagDraft}
                  onSubmitEditing={commitTag}
                  onBlur={commitTag}
                  autoFocus
                  placeholder={text.tag}
                  placeholderTextColor={Palette.faint}
                  style={styles.tagInput}
                />
              ) : (
                <Pressable style={styles.addTag} onPress={() => setAddingTag(true)}>
                  <Icon name="plus" size={14} color={Palette.ink} />
                  <Text style={styles.addTagText}>{text.add}</Text>
                </Pressable>
              )}
            </View>
          </Field>

          <Pressable
            disabled={busy}
            style={({ pressed }) => [styles.create, pressed && styles.pressed]}
            onPress={save}>
            <Text style={styles.createText}>{editing ? text.saveChanges : text.createTask}</Text>
          </Pressable>
          {editing ? (
            <Pressable
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={text.deleteTask}
              style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
              onPress={confirmDelete}>
              <Text style={styles.deleteText}>{text.deleteTaskButton}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
      <DateCalendarPopup
        visible={scheduleOpen === 'date'}
        value={date}
        weekStartsOn={weekStartsOn}
        onClose={() => setScheduleOpen(null)}
        onSelect={setDate}
      />
      <TimePopup
        visible={scheduleOpen === 'time'}
        value={start}
        timeFormat={timeFormat}
        onClose={() => setScheduleOpen(null)}
        onSelect={setStart}
      />
    </Screen>
  );
}

function MissingTask() {
  const text = useCopy();
  const insets = useSafeAreaInsets();

  return (
    <Screen>
      <View style={[styles.missing, { paddingTop: insets.top + 8, paddingHorizontal: Layout.padding }]}>
        <IconButton
          icon="close"
          accessibilityLabel={text.close}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
        />
        <Text style={styles.missingTitle}>{text.taskGoneTitle}</Text>
        <Text style={styles.missingBody}>{text.taskGoneBody}</Text>
      </View>
    </Screen>
  );
}

function dueDateLabel(value: string, dateFormat: 'dmy' | 'mdy' | 'ymd') {
  const [year, month, day] = value.split('-').map(Number);
  return formatDate(new Date(year, month - 1, day), dateFormat);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Palette.ink,
    fontSize: 18,
    fontWeight: 700,
  },
  field: {
    marginTop: 20,
    gap: 8,
  },
  label: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    minHeight: 54,
    backgroundColor: Palette.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    color: Palette.ink,
    fontSize: 15,
    fontWeight: 500,
    ...cardShadow,
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  multiline: {
    minHeight: 104,
    paddingTop: 14,
    paddingBottom: 14,
    alignItems: 'flex-start',
  },
  error: {
    color: Palette.danger,
    fontSize: 12,
    fontWeight: 600,
  },
  dueRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dueField: {
    flex: 1.35,
  },
  timeField: {
    flex: 0.9,
  },
  dueText: {
    color: Palette.ink,
    fontSize: 13,
    fontWeight: 600,
    flexShrink: 1,
  },
  projectHint: {
    color: Palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  projects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  projectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.white,
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 2,
    borderColor: 'transparent',
    ...cardShadow,
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  projectChipSelected: {
    borderColor: Palette.ink,
    backgroundColor: Palette.limeChip,
  },
  projectChipText: {
    color: Palette.ink,
    fontSize: 14,
    fontWeight: 700,
  },
  priorities: {
    flexDirection: 'row',
    gap: 10,
  },
  priority: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  prioritySelected: {
    borderColor: Palette.ink,
  },
  priorityLow: {
    backgroundColor: Palette.low,
  },
  priorityMedium: {
    backgroundColor: Palette.medium,
  },
  priorityHigh: {
    backgroundColor: Palette.high,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: 700,
  },
  priorityLowText: {
    color: Palette.lowText,
  },
  priorityMediumText: {
    color: Palette.mediumText,
  },
  priorityHighText: {
    color: Palette.highText,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.tag,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 34,
  },
  tagText: {
    color: Palette.tagText,
    fontSize: 13,
    fontWeight: 700,
  },
  addTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 34,
  },
  addTagText: {
    color: Palette.ink,
    fontSize: 13,
    fontWeight: 700,
  },
  tagInput: {
    minWidth: 88,
    height: 34,
    borderRadius: 16,
    backgroundColor: Palette.white,
    paddingHorizontal: 12,
    color: Palette.ink,
    fontSize: 13,
  },
  create: {
    marginTop: 28,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: 700,
  },
  delete: {
    marginTop: 12,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: Palette.danger,
    fontSize: 16,
    fontWeight: 700,
  },
  missing: {
    flex: 1,
    gap: 12,
  },
  missingTitle: {
    marginTop: 24,
    color: Palette.ink,
    fontSize: 22,
    fontWeight: 700,
  },
  missingBody: {
    color: Palette.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.85,
  },
});
