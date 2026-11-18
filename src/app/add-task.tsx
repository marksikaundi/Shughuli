import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
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
import { toDateKey, useTasks, type Priority } from '@/data/tasks';

const PROJECTS = ['Website Redesign', 'Mobile App', 'Brand System'];
const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

export default function AddTaskScreen() {
  const insets = useSafeAreaInsets();
  const { addTask } = useTasks();
  const today = new Date();
  const [title, setTitle] = useState('Finish landing page design');
  const [description, setDescription] = useState('Design the new landing page for the product launch.');
  const [priority, setPriority] = useState<Priority>('low');
  const [project, setProject] = useState(PROJECTS[0]);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [tags, setTags] = useState(['Design', 'UI/UX', 'Work']);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [error, setError] = useState('');

  const dueLabel = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

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
    const nextTitle = title.trim();
    if (!nextTitle) {
      setError('Add a task title');
      return;
    }
    try {
      await addTask({
        title: nextTitle,
        description: description.trim(),
        date: toDateKey(today),
        start: '10:00',
        priority,
        project,
        tags,
      });
      leave();
    } catch {
      setError('Could not save this task on the device.');
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
            <Text style={styles.headerTitle}>Add New Task</Text>
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
                <Text style={styles.dueText}>10:00 AM</Text>
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
            <Pressable style={styles.input} onPress={() => setProjectsOpen((open) => !open)}>
              <Icon name="folder" size={16} color={Palette.ink} />
              <Text style={[styles.dueText, styles.projectText]}>{project}</Text>
              <Icon name="chevronDown" size={18} color={Palette.muted} />
            </Pressable>
            {projectsOpen ? (
              <View style={styles.menu}>
                {PROJECTS.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setProject(item);
                      setProjectsOpen(false);
                    }}
                    style={styles.menuItem}>
                    <Text style={[styles.menuText, item === project && styles.menuTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
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

          <Pressable style={({ pressed }) => [styles.create, pressed && styles.pressed]} onPress={save}>
            <Text style={styles.createText}>Create Task</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
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
  projectText: {
    flex: 1,
    fontSize: 15,
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
  menu: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...cardShadow,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: {
    color: Palette.ink,
    fontSize: 15,
  },
  menuTextActive: {
    fontWeight: 700,
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
  pressed: {
    opacity: 0.85,
  },
});
