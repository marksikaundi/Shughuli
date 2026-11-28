import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Night } from '@/constants/night';
import { formatClock, type Task } from '@/data/tasks';
import { useCopy } from '@/lib/settings-copy';

export type TodayLayout = 'list' | 'board' | 'calendar';
export type TodayGrouping = 'none' | 'priority';
export type TodaySorting = 'smart' | 'name' | 'priority';
export type TodaySpan = 'all' | 'today' | 'week' | 'overdue';
export type TodayPriority = 'all' | 'high' | 'medium' | 'low';
export type TodayFeedback = 'checkmark' | 'none';

export type TodayDisplay = {
  layout: TodayLayout;
  showCompleted: boolean;
  feedback: TodayFeedback;
  grouping: TodayGrouping;
  sorting: TodaySorting;
  deadline: TodaySpan;
  priority: TodayPriority;
};

export const defaultTodayDisplay: TodayDisplay = {
  layout: 'list',
  showCompleted: false,
  feedback: 'checkmark',
  grouping: 'none',
  sorting: 'smart',
  deadline: 'all',
  priority: 'all',
};

type Page = null | 'feedback' | 'grouping' | 'sorting' | 'deadline' | 'priority';

export function TodayDisplaySheet({
  value,
  onClose,
  onSave,
}: {
  value: TodayDisplay;
  onClose: () => void;
  onSave: (value: TodayDisplay) => void;
}) {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);
  const [page, setPage] = useState<Page>(null);
  const spanLabel = (span: TodaySpan) => (span === 'today' ? text.today : span === 'week' ? text.thisWeek : span === 'overdue' ? text.overdue : text.all);
  const priorityLabel = (priority: TodayPriority) =>
    priority === 'high' ? text.highPriority : priority === 'medium' ? text.mediumPriority : priority === 'low' ? text.lowPriority : text.all;
  const groupingLabel = draft.grouping === 'priority' ? text.priority : text.none;
  const sortingLabel = draft.sorting === 'name' ? text.sortByName : draft.sorting === 'priority' ? text.priority : text.smart;

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={page ? text.back : text.close} onPress={() => (page ? setPage(null) : onClose())} style={styles.round}>
            <Icon name={page ? 'back' : 'close'} size={16} color={Night.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {page === 'feedback'
              ? text.completedFeedback
              : page === 'grouping'
                ? text.grouping
                : page === 'sorting'
                  ? text.sorting
                  : page === 'deadline'
                    ? text.deadline
                    : page === 'priority'
                      ? text.priority
                      : text.display}
          </Text>
          {page ? (
            <View style={styles.roundSpacer} />
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel={text.save} onPress={() => onSave(draft)} style={[styles.round, styles.save]}>
              <Icon name="check" size={16} color={Night.text} />
            </Pressable>
          )}
        </View>

        {page === null ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <Text style={styles.label}>{text.layout}</Text>
            <View style={styles.card}>
              <View style={styles.layouts}>
                <LayoutChoice id="list" label={text.listLayout} selected={draft.layout === 'list'} onPress={() => setDraft({ ...draft, layout: 'list' })} />
                <LayoutChoice id="board" label={text.boardLayout} selected={draft.layout === 'board'} onPress={() => setDraft({ ...draft, layout: 'board' })} />
                <LayoutChoice id="calendar" label={text.calendarLayout} selected={draft.layout === 'calendar'} onPress={() => setDraft({ ...draft, layout: 'calendar' })} />
              </View>
              <View style={styles.line} />
              <View style={styles.row}>
                <Icon name="check" size={18} color={Night.muted} />
                <Text style={styles.rowLabel}>{text.completedTasks}</Text>
                <Switch
                  accessibilityLabel={text.completedTasks}
                  value={draft.showCompleted}
                  onValueChange={(showCompleted) => setDraft({ ...draft, showCompleted })}
                  trackColor={{ false: '#636366', true: Night.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={styles.line} />
              <Pressable accessibilityRole="button" onPress={() => setPage('feedback')} style={styles.row}>
                <Icon name="bubble" size={18} color={Night.muted} />
                <Text style={styles.rowLabel}>{text.completedFeedback}</Text>
                <Icon name="chevron" size={16} color={Night.faint} />
              </Pressable>
            </View>

            <Text style={styles.label}>{text.sort}</Text>
            <View style={styles.card}>
              <Pressable accessibilityRole="button" onPress={() => setPage('grouping')} style={styles.row}>
                <Icon name="grid" size={18} color={Night.muted} />
                <Text style={styles.rowLabel}>{text.grouping}</Text>
                <Text style={styles.value}>{groupingLabel}</Text>
                <Icon name="chevron" size={16} color={Night.faint} />
              </Pressable>
              <View style={styles.line} />
              <Pressable accessibilityRole="button" onPress={() => setPage('sorting')} style={styles.row}>
                <Icon name="sort" size={18} color={Night.muted} />
                <Text style={styles.rowLabel}>{text.sorting}</Text>
                <Text style={styles.value}>{sortingLabel}</Text>
                <Icon name="chevron" size={16} color={Night.faint} />
              </Pressable>
            </View>

            <Text style={styles.label}>{text.filter}</Text>
            <View style={styles.card}>
              <Pressable accessibilityRole="button" onPress={() => setPage('deadline')} style={styles.row}>
                <Icon name="deadline" size={18} color={Night.muted} />
                <Text style={styles.rowLabel}>{text.deadline}</Text>
                <Text style={styles.value}>{spanLabel(draft.deadline)}</Text>
                <Icon name="chevron" size={16} color={Night.faint} />
              </Pressable>
              <View style={styles.line} />
              <Pressable accessibilityRole="button" onPress={() => setPage('priority')} style={styles.row}>
                <Icon name="flag" size={18} color={Night.muted} />
                <Text style={styles.rowLabel}>{text.priority}</Text>
                <Text style={styles.value}>{priorityLabel(draft.priority)}</Text>
                <Icon name="chevron" size={16} color={Night.faint} />
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.body}>
            {page === 'feedback' ? (
              <Choice
                options={[
                  { id: 'checkmark', label: text.checkmark },
                  { id: 'none', label: text.none },
                ]}
                selected={draft.feedback}
                onSelect={(feedback) => {
                  setDraft({ ...draft, feedback });
                  setPage(null);
                }}
              />
            ) : null}
            {page === 'grouping' ? (
              <Choice
                options={[
                  { id: 'none', label: text.none },
                  { id: 'priority', label: text.priority },
                ]}
                selected={draft.grouping}
                onSelect={(grouping) => {
                  setDraft({ ...draft, grouping });
                  setPage(null);
                }}
              />
            ) : null}
            {page === 'sorting' ? (
              <Choice
                options={[
                  { id: 'smart', label: text.smart },
                  { id: 'name', label: text.sortByName },
                  { id: 'priority', label: text.priority },
                ]}
                selected={draft.sorting}
                onSelect={(sorting) => {
                  setDraft({ ...draft, sorting });
                  setPage(null);
                }}
              />
            ) : null}
            {page === 'deadline' ? (
              <Choice
                options={[
                  { id: 'all', label: text.all },
                  { id: 'today', label: text.today },
                  { id: 'week', label: text.thisWeek },
                  { id: 'overdue', label: text.overdue },
                ]}
                selected={draft.deadline}
                onSelect={(deadline) => {
                  setDraft({ ...draft, deadline });
                  setPage(null);
                }}
              />
            ) : null}
            {page === 'priority' ? (
              <Choice
                options={[
                  { id: 'all', label: text.all },
                  { id: 'high', label: text.highPriority },
                  { id: 'medium', label: text.mediumPriority },
                  { id: 'low', label: text.lowPriority },
                ]}
                selected={draft.priority}
                onSelect={(priority) => {
                  setDraft({ ...draft, priority });
                  setPage(null);
                }}
              />
            ) : null}
          </View>
        )}
      </View>
    </Modal>
  );
}

export function ActivitySheet({ tasks, onClose }: { tasks: Task[]; onClose: () => void }) {
  const text = useCopy();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={text.close} onPress={onClose} style={styles.round}>
            <Icon name="close" size={16} color={Night.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{text.viewActivity}</Text>
          <View style={styles.roundSpacer} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          {tasks.length === 0 ? (
            <Text style={styles.empty}>{text.noTasksYet}</Text>
          ) : (
            <View style={styles.card}>
              {tasks.map((task, index) => (
                <View key={task.id}>
                  {index > 0 ? <View style={styles.line} /> : null}
                  <View style={styles.activity}>
                    <Text style={styles.rowLabel}>{task.title}</Text>
                    <Text style={styles.value}>
                      {task.status === 'done' ? text.done : text.todo} · {formatClock(task.start)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function LayoutChoice({ id, label, selected, onPress }: { id: TodayLayout; label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={styles.layoutChoice}>
      <View style={[styles.preview, selected && styles.previewOn]}>
        {id === 'list' ? <ListPreview on={selected} /> : id === 'board' ? <BoardPreview /> : <CalendarPreview />}
      </View>
      <View style={[styles.layoutPill, selected && styles.layoutPillOn]}>
        <Text style={[styles.layoutText, selected && styles.layoutTextOn]}>{label}</Text>
        {id === 'calendar' ? <Icon name="starFill" size={12} color="#FF9F0A" /> : null}
      </View>
    </Pressable>
  );
}

function ListPreview({ on }: { on: boolean }) {
  const color = on ? Night.accent : '#6A6A6A';
  return (
    <View style={styles.previewInner}>
      <View style={[styles.previewBar, { backgroundColor: color }]} />
      <View style={styles.previewLines}>
        <View style={[styles.previewLine, { backgroundColor: color }]} />
        <View style={[styles.previewLine, styles.previewShort, { backgroundColor: color }]} />
        <View style={[styles.previewLine, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function BoardPreview() {
  return (
    <View style={styles.boardPreview}>
      <View style={styles.boardCol} />
      <View style={styles.boardCol} />
    </View>
  );
}

function CalendarPreview() {
  return (
    <View style={styles.calPreview}>
      {Array.from({ length: 9 }, (_, index) => (
        <View key={index} style={styles.calDot} />
      ))}
    </View>
  );
}

function Choice<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { id: T; label: string }[];
  selected: T;
  onSelect: (id: T) => void;
}) {
  return (
    <View style={styles.card}>
      {options.map((option, index) => (
        <View key={option.id}>
          {index > 0 ? <View style={styles.line} /> : null}
          <Pressable accessibilityRole="button" accessibilityState={{ selected: option.id === selected }} onPress={() => onSelect(option.id)} style={styles.row}>
            <Text style={styles.rowLabel}>{option.label}</Text>
            {option.id === selected ? <Icon name="check" size={16} color={Night.accent} /> : null}
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Night.bg,
    paddingHorizontal: 16,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: Night.text,
    fontSize: 17,
    fontWeight: 700,
  },
  round: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundSpacer: {
    width: 36,
  },
  save: {
    backgroundColor: Night.accent,
  },
  body: {
    paddingBottom: 28,
  },
  label: {
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 12,
    color: Night.muted,
    fontSize: 13,
    fontWeight: 600,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
  },
  layouts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  layoutChoice: {
    width: 96,
    alignItems: 'center',
    gap: 8,
  },
  preview: {
    width: 54,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#5A5A5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewOn: {
    borderColor: Night.accent,
  },
  previewInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewBar: {
    width: 8,
    height: 28,
    borderRadius: 2,
  },
  previewLines: {
    gap: 4,
  },
  previewLine: {
    width: 18,
    height: 3,
    borderRadius: 2,
  },
  previewShort: {
    width: 12,
  },
  boardPreview: {
    flexDirection: 'row',
    gap: 4,
  },
  boardCol: {
    width: 12,
    height: 28,
    borderRadius: 3,
    backgroundColor: '#6A6A6A',
  },
  calPreview: {
    width: 30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  calDot: {
    width: 6,
    height: 6,
    borderRadius: 2,
    backgroundColor: '#6A6A6A',
  },
  layoutPill: {
    minHeight: 26,
    borderRadius: 13,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  layoutPillOn: {
    backgroundColor: Night.accent,
  },
  layoutText: {
    color: Night.muted,
    fontSize: 13,
    fontWeight: 700,
  },
  layoutTextOn: {
    color: Night.text,
  },
  row: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 500,
  },
  value: {
    color: Night.muted,
    fontSize: 15,
    fontWeight: 500,
  },
  line: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44,
    backgroundColor: '#3A3A3A',
  },
  activity: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  empty: {
    marginTop: 28,
    color: Night.muted,
    fontSize: 16,
    textAlign: 'center',
  },
});
