import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  Alert,
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

import { Icon, IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { formatClock, toDateKey, useTasks, type Priority, type Task } from '@/data/tasks';

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

export default function AddTaskScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const taskId = typeof params.id === 'string' ? params.id : undefined;
  const { tasks } = useTasks();
  const task = taskId ? tasks.find((item) => item.id === taskId) : undefined;

  if (taskId && !task) {
    return <MissingTask />;
  }

  return <TaskForm key={task?.id ?? 'new'} task={task} />;
}

function TaskForm({ task }: { task?: Task }) {
  const insets = useSafeAreaInsets();
  const { addTask, updateTask, deleteTask } = useTasks();
  const editing = Boolean(task);
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'low');
  const [project, setProject] = useState(task?.project ?? '');
  const [tags, setTags] = useState<string[]>(task?.tags ?? []);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const date = task?.date ?? toDateKey(new Date());
  const start = task?.start ?? '10:00';

  const dueLabel = dueDateLabel(date);

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
      setError('Add a task title');
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
      setError('Could not save this task on the device.');
    }
  }

  function confirmDelete() {
    if (!task || busy) return;
    Alert.alert('Delete this task?', 'It will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
      setError('Could not delete this task on the device.');
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
            <IconButton icon="close" accessibilityLabel="Close" onPress={leave} />
            <Text style={styles.headerTitle}>{editing ? 'Edit Task' : 'Add New Task'}</Text>
            <IconButton icon="check" accessibilityLabel="Save task" onPress={save} />
          </View>

          <Field label="Task Title">
            <TextInput
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                if (error) setError('');
              }}
              placeholder="Task title"
              placeholderTextColor={Palette.faint}
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </Field>

          <Field label="Description">
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What needs to happen?"
              placeholderTextColor={Palette.faint}
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.multiline]}
            />
          </Field>

          <Field label="Due Date & time">
            <View style={styles.dueRow}>
              <View style={[styles.input, styles.dueField]}>
                <Icon name="calendar" size={16} color={Palette.ink} />
                <Text style={styles.dueText} numberOfLines={1}>
                  {dueLabel}
                </Text>
              </View>
              <View style={[styles.input, styles.timeField]}>
                <Icon name="clock" size={16} color={Palette.ink} />
                <Text style={styles.dueText}>{formatClock(start)}</Text>
              </View>
            </View>
          </Field>

          <Field label="Priority">
            <View style={styles.priorities}>
              {PRIORITIES.map((item) => {
                const selected = priority === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setPriority(item.id)}
                    style={[
                      styles.priority,
                      item.id === 'low' && styles.priorityLow,
                      item.id === 'medium' && styles.priorityMedium,
                      item.id === 'high' && styles.priorityHigh,
                      selected && styles.prioritySelected,
                    ]}>
                    <Text
                      style={[
                        styles.priorityText,
                        item.id === 'low' && styles.priorityLowText,
                        item.id === 'medium' && styles.priorityMediumText,
                        item.id === 'high' && styles.priorityHighText,
                      ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Project">
            <View style={styles.input}>
              <Icon name="folder" size={16} color={Palette.ink} />
              <TextInput
                value={project}
                onChangeText={setProject}
                placeholder="Project name"
                placeholderTextColor={Palette.faint}
                style={styles.projectInput}
              />
            </View>
          </Field>

          <Field label="Tags">
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
                  placeholder="Tag"
                  placeholderTextColor={Palette.faint}
                  style={styles.tagInput}
                />
              ) : (
                <Pressable style={styles.addTag} onPress={() => setAddingTag(true)}>
                  <Icon name="plus" size={14} color={Palette.ink} />
                  <Text style={styles.addTagText}>Add</Text>
                </Pressable>
              )}
            </View>
          </Field>

          <Pressable
            disabled={busy}
            style={({ pressed }) => [styles.create, pressed && styles.pressed]}
            onPress={save}>
            <Text style={styles.createText}>{editing ? 'Save Changes' : 'Create Task'}</Text>
          </Pressable>
          {editing ? (
            <Pressable
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Delete task"
              style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
              onPress={confirmDelete}>
              <Text style={styles.deleteText}>Delete Task</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function MissingTask() {
  const insets = useSafeAreaInsets();

  return (
    <Screen>
      <View style={[styles.missing, { paddingTop: insets.top + 8, paddingHorizontal: Layout.padding }]}>
        <IconButton
          icon="close"
          accessibilityLabel="Close"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
        />
        <Text style={styles.missingTitle}>This task is gone</Text>
        <Text style={styles.missingBody}>It is no longer saved on this device.</Text>
      </View>
    </Screen>
  );
}

function dueDateLabel(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
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
  projectInput: {
    flex: 1,
    color: Palette.ink,
    fontSize: 15,
    fontWeight: 600,
    paddingVertical: 0,
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
