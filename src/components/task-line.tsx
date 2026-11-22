import { useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Night } from '@/constants/night';
import { todayKey, type Task } from '@/data/tasks';
import { formatLocale } from '@/i18n/format';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export function TaskLine({
  task,
  busy,
  onToggle,
  onOpen,
  showMark = true,
  agenda = false,
}: {
  task: Task;
  busy: boolean;
  onToggle: () => void;
  onOpen: () => void;
  showMark?: boolean;
  agenda?: boolean;
}) {
  const text = useCopy();
  const drag = useRef(new Animated.Value(0)).current;
  const actions = useRef({ onToggle, onOpen });
  actions.current = { onToggle, onOpen };
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        drag.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        const prefs = usePreferencesStore.getState().prefs;
        const action = gesture.dx > 72 ? prefs.rightSwipe : gesture.dx < -72 ? prefs.leftSwipe : 'none';
        if (action === 'complete') actions.current.onToggle();
        else if (action === 'schedule' || action === 'select') actions.current.onOpen();
        Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;
  const done = task.status === 'done';
  const today = todayKey();
  const soon = daysUntil(task.date);
  const dateLabel =
    task.date === today
      ? text.today
      : soon > 0 && soon < 7
        ? formatLocale(keyToDate(task.date), { weekday: 'long' })
        : formatLocale(keyToDate(task.date), { day: 'numeric', month: 'short' });
  const dateColor = task.date === today ? '#3CBF73' : soon > 0 && soon < 7 ? '#C4B5FD' : Night.muted;
  const border = Night.faint;

  const projectName = task.project.trim() || text.inbox;

  return (
    <Animated.View style={[styles.row, agenda && styles.rowAgenda, { transform: [{ translateX: drag }] }]} {...pan.panHandlers}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled: busy }}
        accessibilityLabel={task.title}
        disabled={busy}
        hitSlop={8}
        onPress={onToggle}
        style={[styles.box, { borderColor: agenda ? '#8E8E8E' : border }, done && showMark && styles.boxDone]}>
        {done && showMark ? <Icon name="check" size={13} color={Night.text} /> : null}
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.copy}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        {agenda ? null : (
          <View style={styles.when}>
            <Icon name="calendar" size={12} color={dateColor} />
            <Text style={[styles.whenText, { color: dateColor }]}>{dateLabel}</Text>
          </View>
        )}
      </Pressable>
      {agenda ? (
        <View style={styles.project}>
          <Text style={styles.projectText} numberOfLines={1}>
            {projectName}
          </Text>
          <Icon name={task.project.trim() ? 'folder' : 'inbox'} size={14} color={Night.muted} />
        </View>
      ) : null}
    </Animated.View>
  );
}

function daysUntil(key: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = keyToDate(key);
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

function keyToDate(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Night.line,
  },
  rowAgenda: {
    alignItems: 'center',
  },
  box: {
    marginTop: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: {
    backgroundColor: Night.accent,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 500,
  },
  titleDone: {
    color: Night.muted,
    textDecorationLine: 'line-through',
  },
  when: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  whenText: {
    fontSize: 13,
    fontWeight: 600,
  },
  project: {
    maxWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  projectText: {
    flexShrink: 1,
    color: Night.muted,
    fontSize: 13,
    fontWeight: 500,
  },
});
