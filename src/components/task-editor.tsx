import { router } from 'expo-router';
import { useState } from 'react';
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

import { Icon, type IconName } from '@/components/icon';
import { TaskDateSheet } from '@/components/quick-add';
import { Night } from '@/constants/night';
import { formatClock, toDateKey, useTasks, type Priority, type Subtask, type Task, type TaskComment } from '@/data/tasks';
import { useProjects } from '@/data/projects';
import { useSections } from '@/store/sections';
import { formatLocale } from '@/i18n/format';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

export function TaskEditor({ task }: { task: Task }) {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks, updateTask, setTaskStatus, deleteTask } = useTasks();
  const { projects } = useProjects();
  const { sections } = useSections();
  const timeFormat = usePreferencesStore((state) => state.prefs.timeFormat);
  const weekStartsOn = usePreferencesStore((state) => state.prefs.weekStartsOn);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [project, setProject] = useState(task.project.trim());
  const [sectionId, setSectionId] = useState<string | null>(task.sectionId);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [date, setDate] = useState(task.date);
  const [start, setStart] = useState(task.start);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks);
  const [comments, setComments] = useState<TaskComment[]>(task.comments);
  const [done, setDone] = useState(task.status === 'done');
  const [descriptionOpen, setDescriptionOpen] = useState(task.description.trim().length > 0);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const today = toDateKey(new Date());
  const tomorrow = shiftKey(today, 1);
  const dateLabel = date === today ? text.today : date === tomorrow ? text.tomorrow : formatLocale(keyToDate(date), { day: 'numeric', month: 'short' });

  function draft() {
    return {
      title: title.trim() || task.title,
      description: description.trim(),
      date,
      start,
      priority,
      project,
      tags: task.tags,
      subtasks: subtasks.filter((item) => item.title.trim()),
      comments,
      sectionId,
    };
  }

  async function close() {
    if (busy) return;
    setBusy(true);
    try {
      await updateTask(task.id, draft());
      if ((task.status === 'done') !== done) await setTaskStatus(task.id, done ? 'done' : 'todo');
      router.back();
    } catch (error) {
      setBusy(false);
      Alert.alert(text.editTask, error instanceof Error ? error.message : text.couldNotSaveTask);
    }
  }

  function confirmDelete() {
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
    if (busy) return;
    setBusy(true);
    try {
      await deleteTask(task.id);
      router.back();
    } catch (error) {
      setBusy(false);
      Alert.alert(text.deleteTaskTitle, error instanceof Error ? error.message : text.couldNotDeleteTask);
    }
  }

  function addSubtask() {
    setSubtasksOpen(true);
    setSubtasks((items) => [...items, { id: `sub-${Date.now()}`, title: '', done: false }]);
  }

  function addComment() {
    const body = comment.trim();
    if (!body) return;
    setComments((items) => [...items, { id: `note-${Date.now()}`, body, createdAt: new Date().toISOString() }]);
    setComment('');
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable accessibilityRole="button" accessibilityLabel={text.close} style={styles.backdrop} onPress={() => void close()} />
      <View style={[styles.sheet, { marginBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={text.close} onPress={() => void close()} style={styles.round}>
            <Icon name="close" size={16} color={Night.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.more}
            onPress={() => setMoreOpen((open) => !open)}
            style={styles.round}>
            <Icon name="more" size={16} color={Night.text} />
          </Pressable>
        </View>
        {moreOpen ? (
          <Pressable accessibilityRole="button" onPress={confirmDelete} style={styles.moreRow}>
            <Icon name="trash" size={16} color={Night.accent} />
            <Text style={styles.moreText}>{text.delete}</Text>
          </Pressable>
        ) : null}

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <View style={styles.titleRow}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              onPress={() => setDone((value) => !value)}
              style={[styles.box, done && styles.boxDone]}>
              {done ? <Icon name="check" size={14} color={Night.text} /> : null}
            </Pressable>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={text.taskTitlePlaceholder}
              placeholderTextColor={Night.faint}
              style={[styles.title, done && styles.titleDone]}
              multiline
            />
          </View>

          <Pressable accessibilityRole="button" onPress={() => setProjectsOpen((open) => !open)} style={styles.field}>
            <Icon name="inbox" size={18} color={Night.muted} />
            <Text style={styles.fieldText}>{project || text.inbox}</Text>
          </Pressable>
          {projectsOpen ? (
            <View style={styles.menu}>
              <Pressable onPress={() => { setProject(''); setProjectsOpen(false); }} style={styles.menuRow}>
                <Text style={styles.menuText}>{text.inbox}</Text>
              </Pressable>
              {projects.map((item) => (
                <Pressable key={item.id} onPress={() => { setProject(item.name); setProjectsOpen(false); }} style={styles.menuRow}>
                  <Text style={styles.menuText}>{item.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {sections.length > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel={text.section} onPress={() => setSectionsOpen((open) => !open)} style={styles.field}>
              <Icon name="menu" size={18} color={Night.muted} />
              <Text style={styles.fieldText}>{sections.find((item) => item.id === sectionId)?.name ?? text.none}</Text>
            </Pressable>
          ) : null}
          {sectionsOpen ? (
            <View style={styles.menu}>
              <Pressable onPress={() => { setSectionId(null); setSectionsOpen(false); }} style={styles.menuRow}>
                <Text style={styles.menuText}>{text.none}</Text>
              </Pressable>
              {sections.map((item) => (
                <Pressable key={item.id} onPress={() => { setSectionId(item.id); setSectionsOpen(false); }} style={styles.menuRow}>
                  <Text style={styles.menuText}>{item.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Pressable accessibilityRole="button" accessibilityLabel={text.chooseDueDate} onPress={() => setDateOpen(true)} style={styles.field}>
            <Icon name="calendar" size={18} color={Night.muted} />
            <Text style={[styles.fieldText, date === today && styles.todayText]}>{dateLabel}</Text>
          </Pressable>

          <View style={styles.chips}>
            <Chip icon="menu" label={text.description} onPress={() => setDescriptionOpen((open) => !open)} />
            <Chip icon="flag" label={text.priority} onPress={() => setPriorityOpen((open) => !open)} />
            <Chip icon="alarm" label={text.reminders} onPress={() => setReminderOpen((open) => !open)} />
          </View>

          {descriptionOpen ? (
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={text.descriptionPlaceholder}
              placeholderTextColor={Night.faint}
              style={styles.description}
              multiline
            />
          ) : null}
          {priorityOpen ? (
            <View style={styles.pills}>
              {PRIORITIES.map((item) => (
                <Pressable key={item} onPress={() => setPriority(item)} style={[styles.pill, priority === item && styles.pillOn]}>
                  <Text style={styles.pillText}>{item === 'high' ? text.highPriority : item === 'medium' ? text.mediumPriority : text.lowPriority}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {reminderOpen ? (
            <Text style={styles.reminder}>{`${dateLabel} · ${formatClock(start, timeFormat)}`}</Text>
          ) : null}

          <View style={styles.subHead}>
            <Text style={styles.subTitle}>{text.subtasks}</Text>
            <Pressable accessibilityRole="button" onPress={() => setSubtasksOpen((open) => !open)} hitSlop={8}>
              <View style={{ transform: [{ rotate: subtasksOpen ? '0deg' : '180deg' }] }}>
                <Icon name="chevronDown" size={18} color={Night.muted} />
              </View>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={text.addSubtask} onPress={addSubtask} hitSlop={8}>
              <Icon name="plus" size={18} color={Night.muted} />
            </Pressable>
          </View>
          {subtasksOpen ? (
            <>
              {subtasks.map((item) => (
                <View key={item.id} style={styles.subRow}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.done }}
                    onPress={() => setSubtasks((items) => items.map((entry) => (entry.id === item.id ? { ...entry, done: !entry.done } : entry)))}
                    style={[styles.smallBox, item.done && styles.boxDone]}>
                    {item.done ? <Icon name="check" size={11} color={Night.text} /> : null}
                  </Pressable>
                  <TextInput
                    value={item.title}
                    onChangeText={(value) => setSubtasks((items) => items.map((entry) => (entry.id === item.id ? { ...entry, title: value } : entry)))}
                    placeholder={text.addSubtask}
                    placeholderTextColor={Night.faint}
                    style={[styles.subInput, item.done && styles.titleDone]}
                  />
                </View>
              ))}
              <Pressable accessibilityRole="button" onPress={addSubtask} style={styles.addSub}>
                <Icon name="plus" size={16} color={Night.muted} />
                <Text style={styles.addSubText}>{text.addSubtask}</Text>
              </Pressable>
            </>
          ) : null}

          {comments.map((item) => (
            <Text key={item.id} style={styles.commentBody}>
              {item.body}
            </Text>
          ))}
        </ScrollView>

        <View style={styles.comment}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={text.comment}
            placeholderTextColor={Night.faint}
            style={styles.commentInput}
            onSubmitEditing={addComment}
            returnKeyType="send"
          />
        </View>
      </View>

      {dateOpen ? (
        <TaskDateSheet
          date={date}
          time={start}
          weekStartsOn={weekStartsOn}
          timeFormat={timeFormat}
          counts={tasks}
          onClose={() => setDateOpen(false)}
          onSave={(nextDate, nextTime) => {
            setDate(nextDate);
            if (nextTime) setStart(nextTime);
            setDateOpen(false);
            setReminderOpen(true);
          }}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

function Chip({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.chip}>
      <Icon name={icon} size={14} color={Night.muted} />
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

function shiftKey(key: string, days: number) {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function keyToDate(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  sheet: {
    maxHeight: '88%',
    marginHorizontal: 8,
    borderRadius: 22,
    backgroundColor: '#262626',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  round: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreRow: {
    marginHorizontal: 16,
    marginTop: 8,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreText: {
    color: Night.accent,
    fontSize: 15,
    fontWeight: 700,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  titleRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  box: {
    marginTop: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Night.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: {
    backgroundColor: Night.accent,
    borderColor: Night.accent,
  },
  title: {
    flex: 1,
    color: Night.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
    padding: 0,
  },
  titleDone: {
    color: Night.muted,
    textDecorationLine: 'line-through',
  },
  field: {
    minHeight: 48,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Night.line,
  },
  fieldText: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  todayText: {
    color: '#3CBF73',
  },
  menu: {
    borderRadius: 12,
    backgroundColor: '#333333',
    overflow: 'hidden',
  },
  menuRow: {
    minHeight: 42,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  menuText: {
    color: Night.text,
    fontSize: 15,
    fontWeight: 600,
  },
  chips: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    backgroundColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    color: Night.text,
    fontSize: 13,
    fontWeight: 600,
  },
  description: {
    marginTop: 10,
    minHeight: 64,
    color: Night.text,
    fontSize: 16,
    padding: 0,
  },
  pills: {
    marginTop: 10,
    gap: 8,
  },
  pill: {
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#333333',
    justifyContent: 'center',
  },
  pillOn: {
    backgroundColor: Night.accentSoft,
  },
  pillText: {
    color: Night.text,
    fontSize: 15,
    fontWeight: 600,
  },
  reminder: {
    marginTop: 10,
    color: Night.muted,
    fontSize: 14,
    fontWeight: 600,
  },
  subHead: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  subTitle: {
    flex: 1,
    color: Night.text,
    fontSize: 18,
    fontWeight: 700,
  },
  subRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  smallBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Night.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subInput: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    padding: 0,
  },
  addSub: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addSubText: {
    color: Night.text,
    fontSize: 15,
    fontWeight: 600,
  },
  commentBody: {
    marginTop: 10,
    color: Night.text,
    fontSize: 15,
    lineHeight: 21,
  },
  comment: {
    margin: 12,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3A3A3A',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  commentInput: {
    color: Night.text,
    fontSize: 15,
    padding: 0,
  },
});
