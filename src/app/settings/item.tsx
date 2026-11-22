import Constants from 'expo-constants';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NightCard, NightFoot, NightPage, NightSwitch } from '@/components/settings/night-page';
import { useSave } from '@/components/settings/page';
import { Night } from '@/constants/night';
import { APP_TINTS, appTintById, COLOR_THEMES, colorThemeById, QUICK_ADD_ACTIONS, type AppTintId, type ColorThemeId, type QuickAddAction, type ThemeChoice } from '@/data/preferences';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

const ITEMS = ['theme', 'appIcon', 'navigation', 'quickAdd', 'whatsNew'] as const;

type ItemId = (typeof ITEMS)[number];

export default function SettingsItemScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id: ItemId = ITEMS.find((item) => item === params.id) ?? 'theme';
  if (id === 'appIcon') return <AppIconPanel />;
  if (id === 'navigation') return <NavigationPanel />;
  if (id === 'quickAdd') return <QuickAddPanel />;
  if (id === 'whatsNew') return <WhatsNewPanel />;
  return <ThemePanel />;
}

function ThemePanel() {
  const text = useCopy();
  const theme = usePreferencesStore((state) => state.prefs.theme);
  const colorTheme = usePreferencesStore((state) => state.prefs.colorTheme);
  const syncTheme = usePreferencesStore((state) => state.prefs.syncTheme);
  const save = useSave();
  const [sheet, setSheet] = useState(false);
  const [help, setHelp] = useState(false);
  const active = colorThemeById(colorTheme);
  const names = themeNames(text);
  const appearance = theme === 'dark' ? text.themeDark : theme === 'system' ? text.themeAuto : text.themeLight;
  const standard = COLOR_THEMES.filter((item) => !item.pro);
  const pro = COLOR_THEMES.filter((item) => item.pro);

  return (
    <NightPage
      title={text.theme}
      trailing={
        <Pressable accessibilityRole="button" accessibilityLabel={text.helpFeedback} onPress={() => setHelp(true)} style={styles.help}>
          <Text style={styles.helpMark}>?</Text>
        </Pressable>
      }>
      <View style={styles.syncCard}>
        <View style={styles.syncCopy}>
          <Text style={styles.syncLabel}>{text.syncTheme}</Text>
          <Text style={styles.syncBody}>{text.syncThemeBody}</Text>
        </View>
        <Switch
          accessibilityLabel={text.syncTheme}
          value={syncTheme}
          onValueChange={(value) => void save({ syncTheme: value })}
          trackColor={{ false: '#3A3A3A', true: active.color }}
          thumbColor={Night.text}
        />
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel={text.appearance} onPress={() => setSheet(true)} style={({ pressed }) => [styles.appearance, pressed && styles.pressed]}>
        <Text style={styles.syncLabel}>{text.appearance}</Text>
        <Text style={styles.appearanceValue}>{appearance}</Text>
        <Text style={styles.caret}>↕</Text>
      </Pressable>

      {standard.map((item) => (
        <ThemeCard key={item.id} item={item} name={names[item.id]} selected={colorTheme === item.id} onPress={() => void save({ colorTheme: item.id, appTint: item.tint })} />
      ))}
      <Text style={styles.proLabel}>{text.proThemes}</Text>
      {pro.map((item) => (
        <ThemeCard key={item.id} item={item} name={names[item.id]} selected={colorTheme === item.id} onPress={() => void save({ colorTheme: item.id, appTint: item.tint })} />
      ))}

      <ChoiceSheet
        visible={sheet}
        title={text.appearance}
        selected={theme}
        options={[
          { id: 'light', label: text.themeLight },
          { id: 'dark', label: text.themeDark },
          { id: 'system', label: text.themeAuto },
        ]}
        onClose={() => setSheet(false)}
        onSelect={(id) => {
          setSheet(false);
          void save({ theme: id as ThemeChoice });
        }}
      />
      <HelpDialog visible={help} title={text.theme} body={text.themeHelpBody} action={text.close} onClose={() => setHelp(false)} />
    </NightPage>
  );
}

function ThemeCard({
  item,
  name,
  selected,
  onPress,
}: {
  item: (typeof COLOR_THEMES)[number];
  name: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.themeCard, { backgroundColor: item.wash }, pressed && styles.pressed]}>
      <View style={[styles.themeBanner, selected && styles.themeBannerOn, selected && { backgroundColor: item.color }]}>
        <Text style={[styles.themeName, { color: selected ? Night.text : item.ink }]}>{name}</Text>
      </View>
      <View style={styles.previewBlock}>
        <PreviewTask marked={selected} color={item.color} wide />
        <PreviewTask marked={false} color={item.color} wide={false} />
      </View>
    </Pressable>
  );
}

function PreviewTask({ marked, color, wide }: { marked: boolean; color: string; wide: boolean }) {
  return (
    <View style={styles.task}>
      <View style={styles.radio} />
      <View style={styles.lines}>
        <View style={[styles.lineLong, { width: wide ? '78%' : '64%' }]} />
        <View style={[styles.lineShort, { width: wide ? '46%' : '38%' }]} />
      </View>
      {marked ? <Icon name="check" size={16} color={color} /> : <View style={styles.checkSpace} />}
    </View>
  );
}

function themeNames(text: ReturnType<typeof useCopy>): Record<ColorThemeId, string> {
  return {
    shughuli: text.themeShughuli,
    moonstone: text.themeMoonstone,
    tangerine: text.themeTangerine,
    lavender: text.themeLavender,
    blueberry: text.themeBlueberry,
    kale: text.themeKale,
    raspberry: text.themeRaspberry,
  };
}

function ChoiceSheet({
  visible,
  title,
  options,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: { id: string; label: string }[];
  selected: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map((option) => (
            <Pressable key={option.id} accessibilityRole="button" onPress={() => onSelect(option.id)} style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>{option.label}</Text>
              {option.id === selected ? <Icon name="check" size={16} color={Night.accent} /> : null}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function HelpDialog({ visible, title, body, action, onClose }: { visible: boolean; title: string; body: string; action: string; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Text style={styles.helpBody}>{body}</Text>
          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.helpAction, pressed && styles.pressed]}>
            <Text style={styles.helpActionText}>{action}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AppIconPanel() {
  const text = useCopy();
  const tint = usePreferencesStore((state) => state.prefs.appTint);
  const save = useSave();
  const names: Record<AppTintId, string> = {
    coral: text.tintCoral,
    lime: text.tintLime,
    blue: text.tintBlue,
    rose: text.tintRose,
    violet: text.tintViolet,
    moonstone: text.themeMoonstone,
    tangerine: text.themeTangerine,
    lavender: text.themeLavender,
    blueberry: text.themeBlueberry,
    kale: text.themeKale,
    raspberry: text.themeRaspberry,
  };

  return (
    <NightPage title={text.appIcon}>
      <View style={styles.preview}>
        <View style={[styles.mark, { backgroundColor: appTintById(tint).color }]}>
          <Text style={styles.markLetter}>S</Text>
        </View>
        <Text style={styles.previewName}>{names[tint]}</Text>
      </View>
      <NightCard>
        <View style={styles.swatches}>
          {APP_TINTS.filter((item) => item.id === 'coral' || item.id === 'lime' || item.id === 'blue' || item.id === 'rose' || item.id === 'violet').map((item) => {
            const selected = tint === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={names[item.id]}
                accessibilityState={{ selected }}
                onPress={() => void save({ appTint: item.id })}
                style={[styles.swatch, { backgroundColor: item.color }, selected && styles.swatchOn]}>
              </Pressable>
            );
          })}
        </View>
      </NightCard>
      <NightFoot>{text.appTintFoot}</NightFoot>
    </NightPage>
  );
}

function NavigationPanel() {
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();

  return (
    <NightPage title={text.navigation}>
      <NightCard>
        <NightSwitch label={text.showTabLabels} value={prefs.showTabLabels} onChange={(showTabLabels) => void save({ showTabLabels })} />
        <NightSwitch label={text.inbox} value={prefs.showInboxTab} onChange={(showInboxTab) => void save({ showInboxTab })} />
        <NightSwitch label={text.today} value={prefs.showTodayTab} onChange={(showTodayTab) => void save({ showTodayTab })} />
        <NightSwitch label={text.upcoming} value={prefs.showUpcomingTab} onChange={(showUpcomingTab) => void save({ showUpcomingTab })} last />
      </NightCard>
      <NightFoot>{text.navigationKeep}</NightFoot>
    </NightPage>
  );
}

function QuickAddPanel() {
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const names = actionNames(text);
  const included = prefs.quickAddIncluded;
  const more = QUICK_ADD_ACTIONS.filter((id) => !included.includes(id));

  function persist(list: QuickAddAction[]) {
    void save({
      quickAddIncluded: list,
      quickAddProject: true,
      quickAddDate: list.includes('date'),
      quickAddPriority: list.includes('priority'),
    });
  }

  function move(id: QuickAddAction) {
    if (id === 'project') return;
    const list = [...included];
    const index = list.indexOf(id);
    if (index < 1) return;
    const next = index === list.length - 1 ? 1 : index + 1;
    const [item] = list.splice(index, 1);
    list.splice(next, 0, item);
    persist(list);
  }

  return (
    <NightPage title={text.quickAdd}>
      <View style={styles.syncCard}>
        <View style={styles.optionRow}>
          <Text style={styles.syncLabel}>{text.showActionLabels}</Text>
          <Switch
            accessibilityLabel={text.showActionLabels}
            value={prefs.quickAddLabels}
            onValueChange={(quickAddLabels) => void save({ quickAddLabels })}
            trackColor={{ false: '#3A3A3A', true: Night.accent }}
            thumbColor={Night.text}
          />
        </View>
        <View style={styles.optionLine} />
        <View style={styles.optionRow}>
          <Text style={styles.syncLabel}>{text.showDescription}</Text>
          <Switch
            accessibilityLabel={text.showDescription}
            value={prefs.quickAddDescription}
            onValueChange={(quickAddDescription) => void save({ quickAddDescription })}
            trackColor={{ false: '#3A3A3A', true: Night.accent }}
            thumbColor={Night.text}
          />
        </View>
      </View>

      <Text style={styles.taskName}>{text.taskName}</Text>
      <View style={styles.previewChips}>
        <View style={styles.previewPlus}>
          <Text style={styles.previewGlyph}>+</Text>
        </View>
        {included.map((id) => (
          <View key={id} style={[styles.previewChip, !prefs.quickAddLabels && styles.previewChipIcon]}>
            <ActionMark id={id} />
            {prefs.quickAddLabels ? <Text style={styles.previewChipText}>{names[id]}</Text> : null}
          </View>
        ))}
      </View>

      <Text style={styles.actionHeading}>{text.includedTaskActions}</Text>
      <View style={styles.actionCard}>
        {included.map((id, index) => (
          <ActionRow
            key={id}
            id={id}
            name={names[id]}
            locked={id === 'project'}
            last={index === included.length - 1}
            included
            onMove={() => move(id)}
            onToggle={() => persist(included.filter((item) => item !== id))}
          />
        ))}
      </View>

      {more.length > 0 ? <Text style={styles.actionHeading}>{text.moreTaskActions}</Text> : null}
      {more.length > 0 ? (
        <View style={styles.actionCard}>
          {more.map((id, index) => (
            <ActionRow
              key={id}
              id={id}
              name={names[id]}
              last={index === more.length - 1}
              included={false}
              onMove={() => undefined}
              onToggle={() => persist([...included, id])}
            />
          ))}
        </View>
      ) : null}
    </NightPage>
  );
}

function actionNames(text: ReturnType<typeof useCopy>): Record<QuickAddAction, string> {
  return {
    project: text.project,
    date: text.dueDate,
    priority: text.priority,
    labels: text.labels,
  };
}

function ActionMark({ id, muted = true }: { id: QuickAddAction; muted?: boolean }) {
  const color = muted ? Night.muted : Night.text;
  if (id === 'project') return <Text style={[styles.hash, { color }]}>#</Text>;
  if (id === 'date') return <Icon name="calendar" size={16} color={color} />;
  if (id === 'priority') return <Icon name="flag" size={16} color={color} />;
  return <Icon name="tag" size={16} color={color} />;
}

function ActionRow({
  id,
  name,
  locked = false,
  included,
  last,
  onToggle,
  onMove,
}: {
  id: QuickAddAction;
  name: string;
  locked?: boolean;
  included: boolean;
  last: boolean;
  onToggle: () => void;
  onMove: () => void;
}) {
  const text = useCopy();
  return (
    <View>
      <View style={styles.actionRow}>
        {locked ? (
          <View style={styles.lockBubble}>
            <Icon name="lock" size={14} color={Night.text} />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={included ? name : name}
            onPress={onToggle}
            style={[styles.bubble, { backgroundColor: included ? '#E15B52' : '#3DDC84' }]}>
            <Text style={styles.bubbleGlyph}>{included ? '−' : '+'}</Text>
          </Pressable>
        )}
        <ActionMark id={id} />
        <Text style={styles.actionName}>{name}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={text.moveAction} disabled={locked || !included} onPress={onMove} hitSlop={8} style={styles.grip}>
          <View style={styles.gripLine} />
          <View style={styles.gripLine} />
          <View style={styles.gripLine} />
        </Pressable>
      </View>
      {last ? null : <View style={styles.actionLine} />}
    </View>
  );
}

function WhatsNewPanel() {
  const text = useCopy();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <NightPage title={text.whatsNew}>
      <Text style={styles.version}>Shughuli {version}</Text>
      <NightCard>
        <Text style={styles.note}>{text.whatsNewBody}</Text>
      </NightCard>
    </NightPage>
  );
}

const styles = StyleSheet.create({
  preview: {
    marginTop: 28,
    alignItems: 'center',
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: {
    color: '#1A1A1A',
    fontSize: 32,
    fontWeight: 700,
  },
  previewName: {
    marginTop: 12,
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
  },
  swatches: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchOn: {
    borderColor: Night.text,
  },
  version: {
    marginTop: 28,
    color: Night.text,
    fontSize: 17,
    fontWeight: 600,
    textAlign: 'center',
  },
  note: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: Night.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  help: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpMark: {
    color: Night.text,
    fontSize: 18,
    fontWeight: 700,
  },
  syncCard: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: Night.row,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncCopy: {
    flex: 1,
    gap: 2,
  },
  syncLabel: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  syncBody: {
    color: Night.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
  appearance: {
    marginTop: 10,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: Night.row,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appearanceValue: {
    color: Night.muted,
    fontSize: 16,
    fontWeight: 500,
  },
  caret: {
    color: Night.muted,
    fontSize: 14,
    fontWeight: 700,
  },
  proLabel: {
    marginTop: 22,
    marginLeft: 4,
    color: Night.faint,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.8,
  },
  themeCard: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  themeBanner: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  themeBannerOn: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  themeName: {
    fontSize: 20,
    fontWeight: 700,
  },
  previewBlock: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#6E6E6E',
  },
  lines: {
    flex: 1,
    gap: 6,
  },
  lineLong: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4A4A4A',
  },
  lineShort: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3A3A3A',
  },
  checkSpace: {
    width: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    gap: 6,
  },
  sheetTitle: {
    color: Night.text,
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 6,
  },
  sheetRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetLabel: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  helpBody: {
    color: Night.muted,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: 500,
  },
  helpAction: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: Night.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpActionText: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.72,
  },
  optionRow: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLine: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
    backgroundColor: '#3A3A3A',
  },
  taskName: {
    marginTop: 22,
    marginLeft: 4,
    color: Night.muted,
    fontSize: 15,
    fontWeight: 600,
  },
  previewChips: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewPlus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewGlyph: {
    color: Night.text,
    fontSize: 20,
    fontWeight: 500,
    marginTop: -1,
  },
  previewChip: {
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A3A3A',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewChipIcon: {
    width: 36,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  previewChipText: {
    color: Night.text,
    fontSize: 14,
    fontWeight: 600,
  },
  hash: {
    fontSize: 16,
    fontWeight: 700,
  },
  actionHeading: {
    marginTop: 26,
    marginBottom: -4,
    marginLeft: 4,
    color: Night.muted,
    fontSize: 16,
    fontWeight: 700,
  },
  actionCard: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: Night.row,
    overflow: 'hidden',
  },
  actionRow: {
    minHeight: 54,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionName: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  actionLine: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
    backgroundColor: '#3A3A3A',
  },
  bubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleGlyph: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: 700,
    marginTop: -1,
  },
  lockBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grip: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  gripLine: {
    width: 14,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: '#8A8A8A',
  },
});
