import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Night } from '@/constants/night';
import type { Task } from '@/data/tasks';

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
  const done = task.status === 'done';
  const border = done ? Night.accent : task.priority === 'high' ? Night.accent : task.priority === 'medium' ? '#E7A23A' : Night.faint;

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
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  box: {
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
});
