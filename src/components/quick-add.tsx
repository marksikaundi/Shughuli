import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import type { Priority } from '@/data/model';
import { formatClock, startOfWeek, toDateKey, useTasks } from '@/data/tasks';
import { useProjects } from '@/data/projects';
import { formatLocale, formatMonthYear } from '@/i18n/format';
import { fill, useCopy } from '@/lib/settings-copy';
import type { WeekStart } from '@/lib/runtime-prefs';
import { usePreferencesStore } from '@/store/preferences';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

export function QuickAdd({ onClose, bottomInset }: { onClose: () => void; bottomInset: number }) {
  const text = useCopy();
  const { tasks, addTask } = useTasks();
  const { projects } = useProjects();
  const priorityDefault = usePreferencesStore((state) => state.prefs.defaultPriority);
  const planningStart = usePreferencesStore((state) => state.prefs.planningStart);
  const timeFormat = usePreferencesStore((state) => state.prefs.timeFormat);
  const weekStartsOn = usePreferencesStore((state) => state.prefs.weekStartsOn);
  const showPriority = usePreferencesStore((state) => state.prefs.quickAddPriority);
  const showProject = usePreferencesStore((state) => state.prefs.quickAddProject);
  const showDate = usePreferencesStore((state) => state.prefs.quickAddDate);
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [priority, setPriority] = useState<Priority>(priorityDefault);
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [dateChosen, setDateChosen] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = toDateKey(new Date());
  const tomorrow = shiftKey(today, 1);
  const ready = title.trim().length > 0;

  async function submit() {
    const nextTitle = title.trim();
    if (!nextTitle || busy) return;
    setBusy(true);
    try {
      await addTask({
        title: nextTitle,
        description: '',
        date,
        start: time ?? planningStart,
        priority,
        project,
        tags: [],
      });
      onClose();
    } catch (error) {
      setBusy(false);
      Alert.alert(text.addTask, error instanceof Error ? error.message : text.couldNotSaveTask);
    }
  }

  const dateLabel = dateChipLabel(date, dateChosen, time, today, tomorrow, timeFormat, text.today, text.tomorrow, text.dueDate);

  return (
    <View style={[styles.dock, { paddingBottom: bottomInset }]}>
      {priorityOpen ? (
        <View style={styles.menu}>
          {PRIORITIES.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: priority === item }}
              onPress={() => {
                setPriority(item);
                setPriorityOpen(false);
              }}
              style={[styles.menuRow, priority === item && styles.menuRowOn]}>
              <Text style={styles.menuText}>{item === 'high' ? text.highPriority : item === 'medium' ? text.mediumPriority : text.lowPriority}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {projectsOpen ? (
        <View style={styles.menu}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setProject('');
              setProjectsOpen(false);
            }}
            style={[styles.menuRow, project === '' && styles.menuRowOn]}>
            <Text style={styles.menuText}>{text.inbox}</Text>
          </Pressable>
          {projects.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => {
                setProject(item.name);
                setProjectsOpen(false);
              }}
              style={[styles.menuRow, project === item.name && styles.menuRowOn]}>
              <Text style={styles.menuText}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={text.quickPlaceholder}
          placeholderTextColor={Night.faint}
          autoFocus
          style={[styles.input, ready && styles.inputReady]}
          multiline
          submitBehavior="submit"
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
        />
        <View style={styles.tools}>
          {showPriority ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.priority}
            onPress={() => {
              setProjectsOpen(false);
              setPriorityOpen((open) => !open);
            }}
            style={styles.plus}>
            <Icon name="plus" size={16} color={Night.text} />
          </Pressable>
          ) : null}
          {showProject ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={project || text.inbox}
            onPress={() => {
              setPriorityOpen(false);
              setProjectsOpen((open) => !open);
            }}
            style={styles.chip}>
            <Icon name="inbox" size={14} color={Night.muted} />
            <Text style={styles.chipText} numberOfLines={1}>
              {project || text.inbox}
            </Text>
          </Pressable>
          ) : null}
          {showDate ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.chooseDueDate}
            onPress={() => {
              setProjectsOpen(false);
              setPriorityOpen(false);
              setDateOpen(true);
            }}
            style={styles.chip}>
            <Icon name="calendar" size={14} color={Night.muted} />
            <Text style={styles.chipText} numberOfLines={1}>
              {dateLabel}
            </Text>
          </Pressable>
          ) : null}
          <View style={styles.spacer} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ready ? text.save : text.addTask}
            onPress={() => void submit()}
            style={[styles.send, !ready && styles.sendIdle]}>
            <Icon name={ready ? 'up' : 'wave'} size={18} color={Night.text} />
          </Pressable>
        </View>
      </View>

      {dateOpen ? (
        <TaskDateSheet
          date={date}
          time={time}
          weekStartsOn={weekStartsOn}
          timeFormat={timeFormat}
          counts={tasks}
          onClose={() => setDateOpen(false)}
          onSave={(nextDate, nextTime) => {
            setDate(nextDate);
            setDateChosen(true);
            setTime(nextTime);
            setDateOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

export function TaskDateSheet({
  date,
  time,
  weekStartsOn,
  timeFormat,
  counts,
  onClose,
  onSave,
}: {
  date: string;
  time: string | null;
  weekStartsOn: WeekStart;
  timeFormat: '12' | '24';
  counts: { date: string }[];
  onClose: () => void;
  onSave: (date: string, time: string | null) => void;
}) {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const today = toDateKey(new Date());
  const tomorrow = shiftKey(today, 1);
  const weekend = toDateKey(nextWeekend(new Date()));
  const [draftDate, setDraftDate] = useState(date);
  const [draftTime, setDraftTime] = useState<string | null>(time);
  const [phrase, setPhrase] = useState(() => phraseFor(date, time, today, tomorrow, weekend, timeFormat, text));
  const [timeOpen, setTimeOpen] = useState(time != null);
  const [origin] = useState(() => keyToDate(date));
  const months = useMemo(() => {
    const selected = keyToDate(draftDate);
    const span = Math.max(2, (selected.getFullYear() - origin.getFullYear()) * 12 + (selected.getMonth() - origin.getMonth()) + 1);
    return Array.from({ length: Math.min(span, 6) }, (_, offset) => {
      const cursor = new Date(origin.getFullYear(), origin.getMonth() + offset, 1);
      return { key: toDateKey(cursor), label: formatMonthYear(cursor), days: monthDays(cursor, weekStartsOn) };
    });
  }, [draftDate, origin, weekStartsOn]);
  const selectedCount = counts.filter((task) => task.date === draftDate).length;
  const summary = `${formatLocale(keyToDate(draftDate), { weekday: 'short', day: 'numeric', month: 'short' })} · ${
    selectedCount === 1 ? fill(text.taskCountOne, { count: selectedCount }) : fill(text.taskCountOther, { count: selectedCount })
  }`;
  const slots = useMemo(() => {
    const values = [];
    for (let hour = 6; hour <= 22; hour += 1) {
      values.push(`${String(hour).padStart(2, '0')}:00`);
      if (hour < 22) values.push(`${String(hour).padStart(2, '0')}:30`);
    }
    return values;
  }, []);

  function applyPhrase(raw: string) {
    const parsed = parseWhen(raw, {
      today,
      tomorrow,
      weekend,
      todayWord: text.today,
      tomorrowWord: text.tomorrow,
      weekendWord: text.nextWeekend,
    });
    if (!parsed) return;
    if (parsed.date) setDraftDate(parsed.date);
    if (parsed.time) {
      setDraftTime(parsed.time);
      setTimeOpen(true);
    }
  }

  function choose(next: string) {
    setDraftDate(next);
    setPhrase(phraseFor(next, draftTime, today, tomorrow, weekend, timeFormat, text));
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Pressable accessibilityRole="button" accessibilityLabel={text.close} style={styles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={styles.sheetTitle}>{text.dueDate}</Text>
          <View style={styles.phrase}>
            <Icon name="calendar" size={16} color={Night.muted} />
            <TextInput
              value={phrase}
              onChangeText={(value) => {
                setPhrase(value);
                applyPhrase(value);
              }}
              placeholder={text.quickPlaceholder}
              placeholderTextColor={Night.faint}
              style={styles.phraseInput}
              autoCorrect={false}
              autoCapitalize="none"
              onSubmitEditing={() => applyPhrase(phrase)}
            />
          </View>

          <View style={styles.quick}>
            <QuickRow icon="calendar" label={text.today} side={weekday(today)} onPress={() => choose(today)} />
            <View style={styles.quickLine} />
            <QuickRow icon="sun" label={text.tomorrow} side={weekday(tomorrow)} onPress={() => choose(tomorrow)} />
            <View style={styles.quickLine} />
            <QuickRow icon="weekend" label={text.nextWeekend} side={weekday(weekend)} onPress={() => choose(weekend)} />
          </View>

          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.summary}>{summary}</Text>
            <View style={styles.weekdays}>
              {weekdayLabels(weekStartsOn).map((label, index) => (
                <Text key={`${label}-${index}`} style={styles.weekday}>
                  {label}
                </Text>
              ))}
            </View>
            {months.map((month, monthIndex) => (
              <View key={month.key}>
                {monthIndex > 0 ? <Text style={styles.monthLabel}>{month.label}</Text> : null}
                <View style={styles.grid}>
                  {month.days.map((day) => {
                    const key = toDateKey(day);
                    const inMonth = day.getMonth() === keyToDate(month.key).getMonth();
                    const active = key === draftDate;
                    return (
                      <Pressable key={key} accessibilityRole="button" onPress={() => choose(key)} style={styles.cell}>
                        <View style={[styles.day, active && styles.dayOn]}>
                          <Text style={[styles.dayText, !inMonth && styles.dayMuted, active && styles.dayTextOn]}>{day.getDate()}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

            <Pressable accessibilityRole="button" onPress={() => setTimeOpen((open) => !open)} style={styles.timeRow}>
              <Icon name="clock" size={18} color={Night.muted} />
              <Text style={styles.timeLabel}>{draftTime ? formatClock(draftTime, timeFormat) : text.addTime}</Text>
            </Pressable>
            {timeOpen ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.times}>
                {slots.map((slot) => {
                  const active = slot === draftTime;
                  return (
                    <Pressable
                      key={slot}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => {
                        setDraftTime(slot);
                        setPhrase(phraseFor(draftDate, slot, today, tomorrow, weekend, timeFormat, text));
                      }}
                      style={[styles.timeChip, active && styles.timeChipOn]}>
                      <Text style={[styles.timeChipText, active && styles.timeChipTextOn]}>{formatClock(slot, timeFormat)}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.save}
            onPress={() => onSave(draftDate, draftTime)}
            style={styles.save}>
            <Text style={styles.saveText}>{text.save}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function QuickRow({ icon, label, side, onPress }: { icon: IconName; label: string; side: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.quickRow}>
      <Icon name={icon} size={18} color={Night.accent} />
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickSide}>{side}</Text>
    </Pressable>
  );
}

function dateChipLabel(
  date: string,
  chosen: boolean,
  time: string | null,
  today: string,
  tomorrow: string,
  timeFormat: '12' | '24',
  todayLabel: string,
  tomorrowLabel: string,
  dueLabel: string,
) {
  if (!chosen && !time) return dueLabel;
  const base = date === today ? todayLabel : date === tomorrow ? tomorrowLabel : formatLocale(keyToDate(date), { day: 'numeric', month: 'short' });
  return time ? `${base} ${formatClock(time, timeFormat)}` : base;
}

function phraseFor(
  date: string,
  time: string | null,
  today: string,
  tomorrow: string,
  weekend: string,
  timeFormat: '12' | '24',
  text: { today: string; tomorrow: string; nextWeekend: string },
) {
  const base =
    date === today ? text.today.toLowerCase() : date === tomorrow ? text.tomorrow.toLowerCase() : date === weekend ? text.nextWeekend.toLowerCase() : formatLocale(keyToDate(date), { day: 'numeric', month: 'short' });
  return time ? `${base} ${formatClock(time, timeFormat)}` : base;
}

function parseWhen(
  raw: string,
  words: { today: string; tomorrow: string; weekend: string; todayWord: string; tomorrowWord: string; weekendWord: string },
) {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  let date: string | undefined;
  if (hasWord(value, words.todayWord) || /\btoday\b/.test(value)) date = words.today;
  else if (hasWord(value, words.tomorrowWord) || /\btomorrow\b/.test(value)) date = words.tomorrow;
  else if (hasWord(value, words.weekendWord) || /weekend/.test(value)) date = words.weekend;

  const timeMatch =
    value.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) ??
    value.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/) ??
    value.match(/\b(\d{1,2}):(\d{2})\b/);
  let time: string | undefined;
  if (timeMatch) {
    let hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2] ?? 0);
    const period = timeMatch[3];
    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }
  if (!date && !time) return null;
  return { date, time };
}

function hasWord(value: string, word: string) {
  const needle = word.trim().toLowerCase();
  return needle.length > 0 && value.includes(needle);
}

function weekday(key: string) {
  return formatLocale(keyToDate(key), { weekday: 'short' });
}

function weekdayLabels(weekStartsOn: WeekStart) {
  const sunday = new Date(2024, 0, 7);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + (weekStartsOn === 'sunday' ? index : index + 1));
    return formatLocale(date, { weekday: 'narrow' });
  });
}

function monthDays(cursor: Date, weekStartsOn: WeekStart) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = startOfWeek(first, weekStartsOn);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function nextWeekend(from: Date) {
  const date = new Date(from);
  const day = date.getDay();
  const add = day === 6 ? 7 : (6 - day + 7) % 7;
  date.setDate(date.getDate() + add);
  return date;
}

function shiftKey(key: string, days: number) {
  const next = keyToDate(key);
  next.setDate(next.getDate() + days);
  return toDateKey(next);
}

function keyToDate(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

const styles = StyleSheet.create({
  dock: {
    width: '100%',
    maxWidth: Layout.phone,
    alignSelf: 'center',
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#2C2C2C',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  input: {
    minHeight: 28,
    maxHeight: 96,
    color: Night.faint,
    fontSize: 16,
    fontWeight: 500,
    padding: 0,
  },
  inputReady: {
    color: Night.text,
    fontSize: 18,
    fontWeight: 700,
  },
  tools: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    maxWidth: 120,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#3A3A3A',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    flexShrink: 1,
    color: Night.text,
    fontSize: 13,
    fontWeight: 600,
  },
  spacer: {
    flex: 1,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Night.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIdle: {
    opacity: 0.95,
  },
  menu: {
    marginBottom: 8,
    maxHeight: 220,
    borderRadius: 14,
    backgroundColor: '#2C2C2C',
    overflow: 'hidden',
  },
  menuRow: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  menuRowOn: {
    backgroundColor: Night.accentSoft,
  },
  menuText: {
    color: Night.text,
    fontSize: 15,
    fontWeight: 600,
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: Night.bg,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sheetTitle: {
    color: Night.text,
    fontSize: 22,
    fontWeight: 700,
  },
  phrase: {
    marginTop: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: Night.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  phraseInput: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    paddingVertical: 0,
  },
  quick: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: Night.row,
    overflow: 'hidden',
  },
  quickRow: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickLine: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44,
    backgroundColor: Night.line,
  },
  quickLabel: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  quickSide: {
    color: Night.muted,
    fontSize: 14,
    fontWeight: 600,
  },
  sheetScroll: {
    marginTop: 8,
  },
  summary: {
    marginTop: 12,
    color: Night.text,
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
  },
  weekdays: {
    marginTop: 8,
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: Night.muted,
    fontSize: 12,
    fontWeight: 700,
  },
  monthLabel: {
    marginTop: 16,
    marginBottom: 8,
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.285%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: {
    backgroundColor: Night.accent,
  },
  dayText: {
    color: Night.text,
    fontSize: 15,
    fontWeight: 600,
  },
  dayMuted: {
    color: Night.faint,
  },
  dayTextOn: {
    color: Night.text,
    fontWeight: 700,
  },
  timeRow: {
    marginTop: 12,
    marginBottom: 8,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: Night.row,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeLabel: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  times: {
    gap: 8,
    paddingBottom: 12,
  },
  timeChip: {
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: Night.row,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChipOn: {
    backgroundColor: Night.accent,
  },
  timeChipText: {
    color: Night.text,
    fontSize: 13,
    fontWeight: 600,
  },
  timeChipTextOn: {
    fontWeight: 700,
  },
  save: {
    alignSelf: 'flex-end',
    marginTop: 8,
    minWidth: 88,
    height: 42,
    borderRadius: 12,
    paddingHorizontal: 18,
    backgroundColor: Night.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
  },
});
