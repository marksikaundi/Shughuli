import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Night } from '@/constants/night';
import type { InboxDisplay, InboxLayout, InboxPriorityFilter, InboxSpan } from '@/data/inbox-display';
import { useCopy } from '@/lib/settings-copy';

export function DisplaySheet({
  value,
  onClose,
  onSave,
}: {
  value: InboxDisplay;
  onClose: () => void;
  onSave: (value: InboxDisplay) => void;
}) {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);
  const [page, setPage] = useState<Page>(null);
  const spanLabel = (span: InboxSpan) => (span === 'today' ? text.today : span === 'week' ? text.thisWeek : span === 'overdue' ? text.overdue : text.all);
  const priorityLabel = (priority: InboxPriorityFilter) =>
    priority === 'high' ? text.highPriority : priority === 'medium' ? text.mediumPriority : priority === 'low' ? text.lowPriority : text.all;

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
                  : page === 'date'
                    ? text.dueDate
                    : page === 'deadline'
                      ? text.deadline
                      : page === 'priority'
                        ? text.priority
                        : text.display}
          </Text>
          {page ? <View style={styles.roundSpacer} /> : (
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
                  trackColor={{ false: '#3A3A3A', true: Night.accent }}
                  thumbColor={Night.text}
                />
              </View>
              <View style={styles.line} />
              <Pressable accessibilityRole="button" onPress={() => setPage('feedback')} style={styles.row}>
                <Icon name="info" size={18} color={Night.muted} />
                <Text style={styles.rowLabel}>{text.completedFeedback}</Text>
                <Icon name="chevron" size={16} color={Night.faint} />
              </Pressable>
            </View>

            <Text style={styles.label}>{text.sorting}</Text>
            <View style={styles.card}>
              <Pressable accessibilityRole="button" onPress={() => setPage('grouping')} style={styles.row}>
                <Icon name="grid" size={18} color={Night.muted} />
                <Text style={styles.rowLabel}>{text.grouping}</Text>
                <Text style={styles.value}>{draft.grouping === 'date' ? text.dueDate : draft.grouping === 'priority' ? text.priority : text.none}</Text>
                <Icon name="chevron" size={16} color={Night.faint} />
              </Pressable>
              <View style={styles.line} />
              <Pressable accessibilityRole="button" onPress={() => setPage('sorting')} style={styles.row}>
                <Icon name="up" size={18} color={Night.muted} />
                <Text style={styles.rowLabel}>{text.sorting}</Text>
                <Text style={styles.value}>
                  {draft.sorting === 'date' ? text.sortByDate : draft.sorting === 'name' ? text.sortByName : draft.sorting === 'priority' ? text.priority : text.manual}
                </Text>
                <Icon name="chevron" size={16} color={Night.faint} />
              </Pressable>
            </View>

            <Text style={styles.label}>{text.filter}</Text>
            <View style={styles.card}>
              <Pressable accessibilityRole="button" onPress={() => setPage('date')} style={styles.row}>
                <Icon name="calendar" size={18} color={Night.muted} />
                <Text style={styles.rowLabel}>{text.dueDate}</Text>
                <Text style={styles.value}>{spanLabel(draft.date)}</Text>
                <Icon name="chevron" size={16} color={Night.faint} />
              </Pressable>
              <View style={styles.line} />
              <Pressable accessibilityRole="button" onPress={() => setPage('deadline')} style={styles.row}>
                <Icon name="alarm" size={18} color={Night.muted} />
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
                  { id: 'date', label: text.dueDate },
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
                  { id: 'manual', label: text.manual },
                  { id: 'date', label: text.sortByDate },
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
            {page === 'date' || page === 'deadline' ? (
              <Choice
                options={[
                  { id: 'all', label: text.all },
                  { id: 'today', label: text.today },
                  { id: 'week', label: text.thisWeek },
                  { id: 'overdue', label: text.overdue },
                ]}
                selected={page === 'date' ? draft.date : draft.deadline}
                onSelect={(span) => {
                  setDraft(page === 'date' ? { ...draft, date: span } : { ...draft, deadline: span });
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

export function NewSectionSheet({ onClose, onSave }: { onClose: () => void; onSave: (name: string, description: string) => void }) {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const ready = name.trim().length > 0;

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={text.close} onPress={onClose} style={styles.round}>
            <Icon name="close" size={16} color={Night.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{text.newSection}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.save}
            disabled={!ready}
            onPress={() => onSave(name.trim(), description.trim())}
            style={[styles.round, ready ? styles.save : styles.saveOff]}>
            <Icon name="check" size={16} color={Night.text} />
          </Pressable>
        </View>
        <View style={styles.sectionCard}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={text.sectionName}
            placeholderTextColor={Night.faint}
            style={styles.sectionInput}
            autoFocus
          />
          <View style={styles.sectionLine} />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={text.addDescription}
            placeholderTextColor={Night.faint}
            style={styles.sectionNote}
            multiline
          />
        </View>
      </View>
    </Modal>
  );
}

function LayoutChoice({ id, label, selected, onPress }: { id: InboxLayout; label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={styles.layoutChoice}>
      <View style={[styles.preview, selected && styles.previewOn]}>
        {id === 'list' ? <ListPreview on={selected} /> : id === 'board' ? <BoardPreview /> : <CalendarPreview />}
      </View>
      <View style={[styles.layoutPill, selected && styles.layoutPillOn]}>
        <Text style={[styles.layoutText, selected && styles.layoutTextOn]}>{label}</Text>
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

type Page = null | 'feedback' | 'grouping' | 'sorting' | 'date' | 'deadline' | 'priority';

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
  saveOff: {
    opacity: 0.45,
  },
  body: {
    paddingBottom: 28,
  },
  label: {
    marginTop: 22,
    marginBottom: 8,
    color: Night.muted,
    fontSize: 13,
    fontWeight: 700,
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
    width: 92,
    alignItems: 'center',
    gap: 8,
  },
  preview: {
    width: 54,
    height: 68,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#4A4A4A',
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
    minHeight: 24,
    borderRadius: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: 600,
  },
  value: {
    color: Night.muted,
    fontSize: 15,
    fontWeight: 600,
  },
  line: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44,
    backgroundColor: '#3A3A3A',
  },
  sectionCard: {
    marginTop: 22,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sectionInput: {
    minHeight: 44,
    color: Night.text,
    fontSize: 18,
    fontWeight: 600,
  },
  sectionLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#3A3A3A',
  },
  sectionNote: {
    minHeight: 72,
    color: Night.text,
    fontSize: 16,
    paddingTop: 12,
  },
});
