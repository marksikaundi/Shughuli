import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Palette, cardShadow } from '@/constants/palette';
import { formatClock, type Task } from '@/data/tasks';
import { usePreferencesStore } from '@/store/preferences';

const PRIORITY_TONE = {
  high: { bg: Palette.dangerSoft, text: Palette.danger, label: 'High Priority' },
  medium: { bg: '#FFF1DE', text: '#C56A12', label: 'Medium Priority' },
  low: { bg: '#EEF8DC', text: Palette.limeDeep, label: 'Low Priority' },
} as const;

export function TaskCard({ task }: { task: Task }) {
  const tone = PRIORITY_TONE[task.priority];
  const timeFormat = usePreferencesStore((state) => state.prefs.timeFormat);
  const visibility = usePreferencesStore((state) => state.prefs.completedVisibility);
  const dimmed = visibility === 'dim' && task.status === 'done';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${task.title}`}
      onPress={() => router.push({ pathname: '/add-task', params: { id: task.id } })}
      style={[styles.card, dimmed && styles.dimmed]}>
      <View style={styles.cardTop}>
        <View style={[styles.priority, { backgroundColor: tone.bg }]}>
          <View style={[styles.priorityDot, { backgroundColor: tone.text }]} />
          <Text style={[styles.priorityText, { color: tone.text }]}>{tone.label}</Text>
        </View>
        <View style={styles.arrow}>
          <Icon name="arrow" size={14} color={Palette.ink} />
        </View>
      </View>
      <Text style={styles.cardTitle}>{task.title}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.timeRow}>
          <Icon name="clock" size={14} color={Palette.muted} />
          <Text style={styles.time}>
            {formatClock(task.start, timeFormat)} - {formatClock(task.end, timeFormat)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: 26,
    padding: 16,
    ...cardShadow,
  },
  dimmed: {
    opacity: 0.45,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priority: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 600,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    marginTop: 14,
    color: Palette.ink,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  cardFooter: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 500,
  },
});
