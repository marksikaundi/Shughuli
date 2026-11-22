import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DisplaySheet, NewSectionSheet } from '@/components/inbox-sheets';
import { Icon } from '@/components/icon';
import { InboxMark } from '@/components/night-empty';
import { Screen, useNightStatus } from '@/components/screen';
import { TaskLine } from '@/components/task-line';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { defaultInboxDisplay, type InboxDisplay, type InboxSorting, type InboxSpan } from '@/data/inbox-display';
import { toDateKey, type Task } from '@/data/model';
import { formatLocale } from '@/i18n/format';
import { useCopy } from '@/lib/settings-copy';
import { type Section, useSections } from '@/store/sections';
import { useTasks, useTaskStore } from '@/store/tasks';

export default function InboxScreen() {
  useNightStatus();
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks, setTaskStatus } = useTasks();
  const error = useTaskStore((state) => state.error);
  const { sections, addSection } = useSections();
  const [display, setDisplay] = useState<InboxDisplay>(defaultInboxDisplay);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(() => toDateKey(new Date()));
  const today = toDateKey(new Date());

  const inbox = useMemo(() => {
    const visible = tasks.filter((task) => {
      if (task.project.trim() !== '') return false;
      if (task.status === 'done' && !display.showCompleted) return false;
      if (display.priority !== 'all' && task.priority !== display.priority) return false;
      return matches(task.date, display.date, today) && matches(task.date, display.deadline, today);
    });
    return sortTasks(visible, display.sorting);
  }, [display, tasks, today]);

  const groups = useMemo(() => groupTasks(inbox, sections, display, text), [display, inbox, sections, text]);
  const showEmpty = inbox.length === 0 && sections.length === 0;

  const toggle = async (task: Task) => {
    setBusyId(task.id);
    try {
      await setTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen tone="night">
      <View style={[styles.page, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + Layout.tabClearance }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{text.inbox}</Text>
        <View style={styles.pill}>
          <Pressable accessibilityRole="button" accessibilityLabel={text.display} onPress={() => setDisplayOpen(true)} style={styles.pillButton}>
            <Icon name="viewList" size={18} color={Night.text} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={text.newSection} onPress={() => setSectionOpen(true)} style={styles.pillButton}>
            <Icon name="more" size={18} color={Night.text} />
          </Pressable>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {showEmpty ? (
        <View style={styles.empty}>
          <InboxMark />
          <Text style={styles.emptyTitle}>{text.captureTitle}</Text>
          <Text style={styles.emptyBody}>{text.captureBody}</Text>
        </View>
      ) : display.layout === 'calendar' ? (
        <CalendarLayout tasks={inbox} selected={selectedDay} onSelect={setSelectedDay} busyId={busyId} onToggle={toggle} showMark={display.feedback === 'checkmark'} />
      ) : display.layout === 'board' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fill} contentContainerStyle={styles.board}>
          {groups.map((group) => (
            <View key={group.id} style={styles.column}>
              {group.title ? <Text style={styles.section}>{group.title}</Text> : null}
              {group.tasks.map((task) => (
                <TaskLine key={task.id} task={task} busy={busyId === task.id} showMark={display.feedback === 'checkmark'} onToggle={() => void toggle(task)} onOpen={() => router.push({ pathname: '/add-task', params: { id: task.id } })} />
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.fill} contentContainerStyle={styles.list}>
          {groups.map((group) => (
            <View key={group.id}>
              {group.title ? <Text style={styles.section}>{group.title}</Text> : null}
              {group.note ? <Text style={styles.note}>{group.note}</Text> : null}
              {group.tasks.map((task) => (
                <TaskLine key={task.id} task={task} busy={busyId === task.id} showMark={display.feedback === 'checkmark'} onToggle={() => void toggle(task)} onOpen={() => router.push({ pathname: '/add-task', params: { id: task.id } })} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {displayOpen ? <DisplaySheet value={display} onClose={() => setDisplayOpen(false)} onSave={(next) => { setDisplay(next); setDisplayOpen(false); }} /> : null}
      {sectionOpen ? (
        <NewSectionSheet
          onClose={() => setSectionOpen(false)}
          onSave={(name, description) => {
            void addSection(name, description);
            setSectionOpen(false);
          }}
        />
      ) : null}
      </View>
    </Screen>
  );
}

function CalendarLayout({
  tasks,
  selected,
  onSelect,
  busyId,
  onToggle,
  showMark,
}: {
  tasks: Task[];
  selected: string;
  onSelect: (day: string) => void;
  busyId: string | null;
  onToggle: (task: Task) => void;
  showMark: boolean;
}) {
  const [year, month] = selected.split('-').map(Number);
  const first = new Date(year, month - 1, 1);
  const start = (first.getDay() + 6) % 7;
  const days = new Date(year, month, 0).getDate();
  const cells = [...Array.from({ length: start }, () => ''), ...Array.from({ length: days }, (_, index) => iso(year, month, index + 1))];
  const dayTasks = tasks.filter((task) => task.date === selected);
  const label = formatLocale(new Date(year, month - 1, 1), { month: 'long', year: 'numeric' });

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.fill} contentContainerStyle={styles.list}>
      <View style={styles.monthRow}>
        <Pressable accessibilityRole="button" onPress={() => onSelect(shiftMonth(selected, -1))} style={styles.monthButton}>
          <Icon name="back" size={16} color={Night.text} />
        </Pressable>
        <Text style={styles.monthLabel}>{label}</Text>
        <Pressable accessibilityRole="button" onPress={() => onSelect(shiftMonth(selected, 1))} style={styles.monthButton}>
          <Icon name="chevron" size={16} color={Night.text} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {cells.map((day, index) => {
          const number = day ? Number(day.slice(8)) : 0;
          const marked = tasks.some((task) => task.date === day);
          return (
            <Pressable key={`${day}-${index}`} disabled={!day} onPress={() => onSelect(day)} style={styles.cell}>
              <View style={[styles.cellFace, day === selected && styles.cellOn]}>
                {day ? <Text style={styles.cellText}>{number}</Text> : null}
              </View>
              {marked && day !== selected ? <View style={styles.dot} /> : null}
            </Pressable>
          );
        })}
      </View>
      {dayTasks.map((task) => (
        <TaskLine key={task.id} task={task} busy={busyId === task.id} showMark={showMark} onToggle={() => onToggle(task)} onOpen={() => router.push({ pathname: '/add-task', params: { id: task.id } })} />
      ))}
    </ScrollView>
  );
}

function matches(date: string, span: InboxSpan, today: string) {
  if (span === 'all') return true;
  if (span === 'today') return date === today;
  if (span === 'overdue') return date < today;
  const end = new Date(`${today}T12:00:00`);
  end.setDate(end.getDate() + 7);
  return date >= today && date < end.toISOString().slice(0, 10);
}

function sortTasks(items: Task[], sorting: InboxSorting) {
  const copy = [...items];
  if (sorting === 'manual') return copy;
  const rank = { high: 0, medium: 1, low: 2 };
  copy.sort((left, right) => {
    if (sorting === 'name') return left.title.localeCompare(right.title);
    if (sorting === 'priority') return rank[left.priority] - rank[right.priority] || left.title.localeCompare(right.title);
    return left.date.localeCompare(right.date) || left.start.localeCompare(right.start) || left.title.localeCompare(right.title);
  });
  return copy;
}

function groupTasks(items: Task[], sections: Section[], display: InboxDisplay, text: ReturnType<typeof useCopy>) {
  if (display.grouping === 'priority') {
    return (['high', 'medium', 'low'] as const)
      .map((priority) => ({
        id: priority,
        title: priority === 'high' ? text.highPriority : priority === 'medium' ? text.mediumPriority : text.lowPriority,
        note: '',
        tasks: items.filter((task) => task.priority === priority),
      }))
      .filter((group) => group.tasks.length > 0);
  }
  if (display.grouping === 'date') {
    return [...new Set(items.map((task) => task.date))].sort().map((date) => ({
      id: date,
      title: formatLocale(keyToDate(date), { weekday: 'short', day: 'numeric', month: 'short' }),
      note: '',
      tasks: items.filter((task) => task.date === date),
    }));
  }
  const groups = [
    { id: 'inbox', title: '', note: '', tasks: items.filter((task) => !task.sectionId) },
    ...sections.map((section) => ({
      id: section.id,
      title: section.name,
      note: section.description,
      tasks: items.filter((task) => task.sectionId === section.id),
    })),
  ];
  return groups.filter((group) => group.title !== '' || group.tasks.length > 0);
}

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return iso(date.getFullYear(), date.getMonth() + 1, 1);
}

function keyToDate(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: Layout.padding,
  },
  fill: {
    flex: 1,
  },
  error: {
    marginTop: 16,
    color: Night.accent,
    fontSize: 14,
    fontWeight: 600,
  },
  header: {
    marginTop: 8,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    color: Night.text,
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 2,
  },
  pillButton: {
    width: 38,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
  list: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  section: {
    marginTop: 18,
    marginBottom: 4,
    color: Night.text,
    fontSize: 20,
    fontWeight: 700,
  },
  note: {
    marginBottom: 6,
    color: Night.muted,
    fontSize: 14,
  },
  board: {
    paddingTop: 18,
    gap: 12,
  },
  column: {
    width: 260,
    borderRadius: 16,
    backgroundColor: '#262626',
    padding: 12,
  },
  monthRow: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    color: Night.text,
    fontSize: 17,
    fontWeight: 700,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  cell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFace: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellOn: {
    backgroundColor: Night.accent,
  },
  cellText: {
    color: Night.text,
    fontSize: 14,
    fontWeight: 600,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Night.accent,
  },
});
