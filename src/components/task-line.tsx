import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Night } from '@/constants/night';
import { toDateKey, type Task } from '@/data/tasks';
import { formatLocale } from '@/i18n/format';
import { useCopy } from '@/lib/settings-copy';

export function TaskLine({
  task,
  busy,
  onToggle,
  onOpen,
}: {
  task: Task;
  busy: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const text = useCopy();
  const done = task.status === 'done';
  const today = toDateKey(new Date());
  const soon = daysUntil(task.date);
  const dateLabel =
    task.date === today
      ? text.today
      : soon > 0 && soon < 7
        ? formatLocale(keyToDate(task.date), { weekday: 'long' })
        : formatLocale(keyToDate(task.date), { day: 'numeric', month: 'short' });
  const dateColor = task.date === today ? '#3CBF73' : soon > 0 && soon < 7 ? '#C4B5FD' : Night.muted;
  const border = Night.faint;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled: busy }}
        accessibilityLabel={task.title}
        disabled={busy}
        hitSlop={8}
        onPress={onToggle}
        style={[styles.box, { borderColor: border }, done && styles.boxDone]}>
        {done ? <Icon name="check" size={13} color={Night.text} /> : null}
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.copy}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.when}>
          <Icon name="calendar" size={12} color={dateColor} />
          <Text style={[styles.whenText, { color: dateColor }]}>{dateLabel}</Text>
        </View>
      </Pressable>
    </View>
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
});
