import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Palette } from '@/constants/palette';
import { PEOPLE, type PersonId } from '@/data/people';

export function Avatar({
  person,
  size = 44,
  style,
}: {
  person: (typeof PEOPLE)[PersonId];
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: person.color,
        },
        style,
      ]}>
      <Text style={[styles.initials, { color: person.text, fontSize: size * 0.32 }]}>{person.initials}</Text>
    </View>
  );
}

export function AvatarStack({
  ids,
  extra = 0,
  size = 28,
}: {
  ids: PersonId[];
  extra?: number;
  size?: number;
}) {
  return (
    <View style={styles.stack}>
      {ids.map((id, index) => (
        <Avatar
          key={id}
          person={PEOPLE[id]}
          size={size}
          style={{ marginLeft: index === 0 ? 0 : -8, borderWidth: 2, borderColor: Palette.white }}
        />
      ))}
      {extra > 0 ? (
        <View
          style={[
            styles.extra,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: ids.length ? -8 : 0,
            },
          ]}>
          <Text style={styles.extraText}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: 700,
  },
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  extra: {
    backgroundColor: '#ECECF1',
    borderWidth: 2,
    borderColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: {
    color: '#4A4A50',
    fontSize: 11,
    fontWeight: 700,
  },
});
