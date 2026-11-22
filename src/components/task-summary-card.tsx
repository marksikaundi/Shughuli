import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Palette, cardShadow } from '@/constants/palette';
import { PEOPLE, type PersonId } from '@/data/people';
import { formatClock, todayKey, type Task } from '@/data/tasks';
import { fill, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export function TaskSummaryCard({ task }: { task: Task }) {
  const text = useCopy();
  const timeFormat = usePreferencesStore((state) => state.prefs.timeFormat);
  const today = todayKey();
  const kind = task.kind === 'meeting' ? text.meet : task.category === 'personal' ? text.categoryPersonal : text.work;
  const day = task.date === today ? text.today : task.date === shift(today, 1) ? text.tomorrow : task.date === shift(today, -1) ? text.yesterday : task.date;
  const place = task.project.trim();
  const detail = place ? `${place} ${day}, ${formatClock(task.start, timeFormat)}` : `${day}, ${formatClock(task.start, timeFormat)}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={fill(text.editNamed, { name: task.title })}
      onPress={() => router.push({ pathname: '/add-task', params: { id: task.id } })}
      style={({ pressed }) => [styles.card, task.status === 'done' && styles.done, pressed && styles.pressed]}>
      <View style={styles.copy}>
        <View style={styles.top}>
          <View style={styles.kindRow}>
            <Icon name={task.kind === 'meeting' ? 'video' : 'check'} size={14} color={Palette.muted} />
            <Text style={styles.kind}>{kind}</Text>
          </View>
          <Avatars ids={task.people} />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <View style={styles.arrow}>
        <Icon name="forward" size={16} color={Palette.white} />
      </View>
    </Pressable>
  );
}

function Avatars({ ids }: { ids: PersonId[] }) {
  const shown = ids.filter((id) => PEOPLE[id]).slice(0, 3);
  if (shown.length === 0) return null;
  return (
    <View style={styles.avatars}>
      {shown.map((id, index) => (
        <View
          key={id}
          style={[
            styles.avatar,
            { backgroundColor: PEOPLE[id].color, marginLeft: index === 0 ? 0 : -8, zIndex: shown.length - index },
          ]}>
          <Text style={[styles.initial, { color: PEOPLE[id].text }]}>{PEOPLE[id].initials.slice(0, 1)}</Text>
        </View>
      ))}
    </View>
  );
}

function shift(key: string, days: number) {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setDate(date.getDate() + days);
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${nextMonth}-${nextDay}`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...cardShadow,
    shadowOpacity: 0.05,
    shadowRadius: 14,
  },
  done: {
    opacity: 0.55,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  kindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kind: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 600,
  },
  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 10,
    fontWeight: 700,
  },
  title: {
    color: Palette.ink,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  detail: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 500,
  },
  arrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.84,
  },
});
