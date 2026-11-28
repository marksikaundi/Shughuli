import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { NightCard, NightFoot, NightPage } from '@/components/settings/night-page';
import { useSave } from '@/components/settings/page';
import { Night } from '@/constants/night';
import { RELEASES } from '@/data/release-notes';
import { APP_ICONS, appIconByName, type AppIconChoice } from '@/data/app-icons';
import { COLOR_THEMES, colorThemeById, QUICK_ADD_ACTIONS, QUICK_ADD_PRO, type ColorThemeId, type QuickAddAction, type TabId, type ThemeChoice } from '@/data/preferences';
import { fill } from '@/i18n/translate';
import { appIconsAvailable, changeAppIcon, readAppIconName } from '@/lib/app-icons';
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
  const activated = usePreferencesStore((state) => state.prefs.appIconsActivated);
  const save = useSave();
  const [current, setCurrent] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [help, setHelp] = useState(false);
  const helpButton = (
    <Pressable accessibilityRole="button" accessibilityLabel={text.helpFeedback} onPress={() => setHelp(true)} style={styles.help}>
      <Text style={styles.helpMark}>?</Text>
    </Pressable>
  );
  const helpDialog = <HelpDialog visible={help} title={text.appIcon} body={text.appIconHelpBody} action={text.close} onClose={() => setHelp(false)} />;
  const names: Record<AppIconChoice['id'], string> = {
    default: text.appIconDefault,
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

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [ready, name] = await Promise.all([appIconsAvailable(), readAppIconName()]);
      if (!alive) return;
      setAvailable(ready);
      setCurrent(name);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function choose(item: AppIconChoice) {
    if (busy) return;
    setBusy(true);
    try {
      await changeAppIcon(item.name);
      setCurrent(item.name);
      if (item.tint) await save({ appTint: item.tint });
    } catch {
      setFailure(available ? text.appIconFailed : text.appIconUnsupported);
    } finally {
      setBusy(false);
    }
  }

  if (!activated) {
    return (
      <NightPage title={text.appIcon} trailing={helpButton}>
        <View style={styles.intro}>
          <View style={styles.introArt}>
            <Text style={[styles.sparkle, styles.sparkleLeft]}>✦</Text>
            <Text style={[styles.sparkle, styles.sparkleRight]}>✦</Text>
            <Text style={[styles.sparkle, styles.sparkleTop]}>✧</Text>
            <Image source={APP_ICONS[3].image} style={[styles.introTile, styles.introTileBack, styles.introTileLeft]} />
            <Image source={APP_ICONS[2].image} style={[styles.introTile, styles.introTileBack, styles.introTileRight]} />
            <Image source={APP_ICONS[1].image} style={[styles.introTile, styles.introTileFront]} />
          </View>
          <Text style={styles.introTitle}>{text.appIconIntroTitle}</Text>
          <Text style={styles.introBody}>{text.appIconIntroBody}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.appIconActivate}
            onPress={() => void save({ appIconsActivated: true })}
            style={({ pressed }) => [styles.activate, pressed && styles.pressed]}>
            <Text style={styles.activateText}>{text.appIconActivate}</Text>
          </Pressable>
        </View>
        {helpDialog}
      </NightPage>
    );
  }

  const selectedId = appIconByName(current).id;

  return (
    <NightPage title={text.appIcon} trailing={helpButton}>
      <View style={styles.iconGrid}>
        {APP_ICONS.map((item) => {
          const selected = selectedId === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={names[item.id]}
              accessibilityState={{ selected, busy }}
              onPress={() => void choose(item)}
              style={({ pressed }) => [styles.iconCell, pressed && styles.pressed]}>
              <View style={[styles.iconRing, selected && styles.iconRingOn]}>
                <Image source={item.image} style={styles.iconImage} />
              </View>
            </Pressable>
          );
        })}
      </View>
      <NightFoot>{text.appIconFoot}</NightFoot>
      {helpDialog}
      <HelpDialog visible={failure !== ''} title={text.appIcon} body={failure} action={text.close} onClose={() => setFailure('')} />
    </NightPage>
  );
}

const NAV_TABS: { id: TabId; icon: IconName; locked: boolean }[] = [
  { id: 'inbox', icon: 'inbox', locked: false },
  { id: 'today', icon: 'calendar', locked: false },
  { id: 'upcoming', icon: 'month', locked: false },
  { id: 'browse', icon: 'list', locked: true },
];

function NavigationPanel() {
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const [editing, setEditing] = useState(false);
  const names: Record<TabId, string> = {
    inbox: text.inbox,
    today: text.today,
    upcoming: text.upcoming,
    browse: text.browse,
  };
  const visible = prefs.tabOrder.filter((id) => tabShown(id, prefs));
  const menu = NAV_TABS.filter((item) => !item.locked);

  function shownPatch(id: TabId, value: boolean) {
    if (id === 'inbox') return { showInboxTab: value };
    if (id === 'today') return { showTodayTab: value };
    if (id === 'upcoming') return { showUpcomingTab: value };
    return {};
  }

  function move(id: TabId) {
    const list = [...prefs.tabOrder];
    const index = list.indexOf(id);
    if (index < 0) return;
    const next = index === list.length - 1 ? 0 : index + 1;
    const [item] = list.splice(index, 1);
    list.splice(next, 0, item);
    void save({ tabOrder: list });
  }

  function addTab() {
    const hidden = prefs.tabOrder.find((id) => id !== 'browse' && !tabShown(id, prefs));
    if (hidden) void save(shownPatch(hidden, true));
  }

  return (
    <NightPage
      title={text.navigation}
      trailing={
        editing ? (
          <Pressable accessibilityRole="button" accessibilityLabel={text.done} onPress={() => setEditing(false)} style={styles.navDone}>
            <Icon name="check" size={18} color="#FFFFFF" />
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel={text.edit} onPress={() => setEditing(true)} style={styles.navEdit}>
            <Text style={styles.navEditText}>{text.edit}</Text>
          </Pressable>
        )
      }>
      <Text style={styles.navHeading}>{text.tabBarSection}</Text>
      <View style={styles.actionCard}>
        {visible.map((id, index) => {
          const item = NAV_TABS.find((tab) => tab.id === id)!;
          const last = index === visible.length - 1 && editing;
          return (
            <View key={id}>
              <View style={styles.navRow}>
                {editing && !item.locked ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={names[id]} onPress={() => void save(shownPatch(id, false))} style={[styles.bubble, { backgroundColor: '#E24B4A' }]}>
                    <View style={styles.minusBar} />
                  </Pressable>
                ) : null}
                <Icon name={item.icon} size={20} color={Night.accent} />
                <Text style={styles.navName}>{names[id]}</Text>
                {!editing && !item.locked ? <Icon name="chevron" size={16} color="#6E6E6E" /> : null}
                <Pressable accessibilityRole="button" accessibilityLabel={text.moveAction} onPress={() => move(id)} hitSlop={8} style={styles.grip}>
                  <View style={styles.gripLine} />
                  <View style={styles.gripLine} />
                  <View style={styles.gripLine} />
                </Pressable>
              </View>
              {last ? null : <View style={styles.navLine} />}
            </View>
          );
        })}
        {editing ? null : (
          <Pressable accessibilityRole="button" accessibilityLabel={text.addTab} onPress={addTab} style={styles.navRow}>
            <Text style={styles.navPlus}>+</Text>
            <Text style={styles.navAdd}>{text.addTab}</Text>
            <View style={styles.actionSpacer} />
            <Icon name="chevron" size={16} color="#6E6E6E" />
          </Pressable>
        )}
      </View>
      <Text style={styles.navFoot}>{text.navigationFoot}</Text>

      <View style={styles.navMenuHead}>
        <Text style={styles.navHeading}>{text.menuItems}</Text>
        <Pressable accessibilityRole="button" onPress={() => void save({ showInboxTab: false, showTodayTab: false, showUpcomingTab: false })}>
          <Text style={styles.navHide}>{text.hideAll}</Text>
        </Pressable>
      </View>
      <View style={styles.actionCard}>
        {menu.map((item, index) => {
          const on = tabShown(item.id, prefs);
          return (
            <View key={item.id}>
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => void save(shownPatch(item.id, !on))} style={styles.navRow}>
                <View style={[styles.menuCheck, on && styles.menuCheckOn]}>{on ? <Icon name="check" size={12} color="#FFFFFF" /> : null}</View>
                <Icon name={item.icon} size={20} color={Night.accent} />
                <Text style={styles.navName}>{names[item.id]}</Text>
              </Pressable>
              {index === menu.length - 1 ? null : <View style={styles.navLine} />}
            </View>
          );
        })}
      </View>
    </NightPage>
  );
}

function tabShown(id: TabId, prefs: { showInboxTab: boolean; showTodayTab: boolean; showUpcomingTab: boolean }) {
  if (id === 'inbox') return prefs.showInboxTab;
  if (id === 'today') return prefs.showTodayTab;
  if (id === 'upcoming') return prefs.showUpcomingTab;
  return true;
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
      quickAddSeen: true,
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
      <View style={styles.quickTop}>
        <View style={styles.quickRow}>
          <Text style={styles.quickLabel}>{text.showActionLabels}</Text>
          <Switch
            accessibilityLabel={text.showActionLabels}
            value={prefs.quickAddLabels}
            onValueChange={(quickAddLabels) => void save({ quickAddLabels })}
            trackColor={{ false: '#636366', true: Night.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View style={styles.quickLine} />
        <View style={styles.quickRow}>
          <Text style={styles.quickLabel}>{text.showDescription}</Text>
          <Switch
            accessibilityLabel={text.showDescription}
            value={prefs.quickAddDescription}
            onValueChange={(quickAddDescription) => void save({ quickAddDescription })}
            trackColor={{ false: '#636366', true: Night.accent }}
            thumbColor="#FFFFFF"
          />
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
      </View>

      <Text style={styles.actionHeading}>{text.includedTaskActions}</Text>
      <View style={styles.actionCard}>
        {included.map((id, index) => (
          <ActionRow
            key={id}
            id={id}
            name={names[id]}
            pro={QUICK_ADD_PRO.includes(id)}
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
              pro={QUICK_ADD_PRO.includes(id)}
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
    reminders: text.reminders,
    labels: text.labels,
  };
}

function ActionMark({ id }: { id: QuickAddAction }) {
  const color = '#C8C8C8';
  if (id === 'project') return <Text style={[styles.hash, { color }]}>#</Text>;
  return <Icon name={actionIcon(id)} size={18} color={color} />;
}

function actionIcon(id: QuickAddAction): IconName {
  if (id === 'date') return 'calendar';
  if (id === 'priority') return 'flag';
  if (id === 'reminders') return 'alarm';
  return 'tagLine';
}

function PlusMark() {
  return (
    <View style={styles.plusWrap}>
      <View style={styles.plusBar} />
      <View style={[styles.plusBar, styles.plusBarVert]} />
    </View>
  );
}

function ActionRow({
  id,
  name,
  pro = false,
  locked = false,
  included,
  last,
  onToggle,
  onMove,
}: {
  id: QuickAddAction;
  name: string;
  pro?: boolean;
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
            <Icon name="lock" size={18} color="#F4F4F4" />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={name}
            onPress={onToggle}
            style={[styles.bubble, { backgroundColor: included ? '#E24B4A' : '#32C85A' }]}>
            {included ? <View style={styles.minusBar} /> : <PlusMark />}
          </Pressable>
        )}
        <ActionMark id={id} />
        <Text style={styles.actionName}>{name}</Text>
        {pro ? <Icon name="starFill" size={13} color="#FF9F0A" /> : null}
        <View style={styles.actionSpacer} />
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

  return (
    <NightPage title={text.whatsNew}>
      <NightCard>
        <Text style={styles.note}>{text.whatsNewBody}</Text>
      </NightCard>
      {RELEASES.map((release) => (
        <View key={release.version}>
          <Text style={styles.releaseTitle}>{fill(text.releaseVersion, { version: release.version })}</Text>
          <NightCard>
            {release.features.map((feature, index) => (
              <FeatureRow
                key={feature.title}
                icon={feature.icon}
                title={text[feature.title]}
                body={text[feature.body]}
                last={index === release.features.length - 1}
              />
            ))}
          </NightCard>
        </View>
      ))}
    </NightPage>
  );
}

function FeatureRow({ icon, title, body, last }: { icon: IconName; title: string; body: string; last: boolean }) {
  return (
    <View>
      <View style={styles.feature}>
        <View style={styles.featureMark}>
          <Icon name={icon} size={18} color={Night.accent} />
        </View>
        <View style={styles.featureCopy}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureBody}>{body}</Text>
        </View>
      </View>
      {last ? null : <View style={styles.featureLine} />}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginTop: 16,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  introArt: {
    width: '100%',
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTile: {
    position: 'absolute',
    borderRadius: 28,
  },
  introTileFront: {
    width: 116,
    height: 116,
    borderRadius: 30,
  },
  introTileBack: {
    width: 84,
    height: 84,
    top: 74,
    opacity: 0.85,
  },
  introTileLeft: {
    left: '12%',
    transform: [{ rotate: '-12deg' }],
  },
  introTileRight: {
    right: '12%',
    transform: [{ rotate: '12deg' }],
  },
  sparkle: {
    position: 'absolute',
    color: Night.accent,
    fontSize: 22,
  },
  sparkleLeft: {
    left: '16%',
    top: 18,
  },
  sparkleRight: {
    right: '14%',
    top: 40,
    fontSize: 16,
  },
  sparkleTop: {
    right: '34%',
    top: 4,
    fontSize: 14,
  },
  introTitle: {
    marginTop: 20,
    color: Night.text,
    fontSize: 24,
    fontWeight: 700,
    textAlign: 'center',
  },
  introBody: {
    marginTop: 12,
    color: Night.muted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  activate: {
    marginTop: 28,
    alignSelf: 'stretch',
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: Night.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 700,
  },
  iconGrid: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  iconCell: {
    width: '33.333%',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconRing: {
    width: 100,
    height: 100,
    padding: 4,
    borderRadius: Platform.OS === 'ios' ? 30 : 50,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  iconRingOn: {
    borderColor: Night.text,
  },
  iconImage: {
    width: '100%',
    height: '100%',
    borderRadius: Platform.OS === 'ios' ? 22 : 46,
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
  releaseTitle: {
    marginTop: 28,
    marginLeft: 4,
    color: Night.text,
    fontSize: 22,
    fontWeight: 700,
  },
  feature: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Night.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
  },
  featureBody: {
    color: Night.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  featureLine: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 66,
    backgroundColor: '#3A3A3A',
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
  quickTop: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    paddingBottom: 16,
    overflow: 'hidden',
  },
  quickRow: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickLabel: {
    flex: 1,
    color: '#F2F2F2',
    fontSize: 17,
    fontWeight: 400,
  },
  quickLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#3A3A3C',
  },
  taskName: {
    marginTop: 16,
    marginHorizontal: 16,
    color: '#F2F2F2',
    fontSize: 16,
    fontWeight: 500,
  },
  previewChips: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  previewPlus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A3A3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewGlyph: {
    color: '#F2F2F2',
    fontSize: 22,
    fontWeight: 400,
    marginTop: -2,
  },
  previewChip: {
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A3A3C',
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
    color: '#F2F2F2',
    fontSize: 15,
    fontWeight: 600,
  },
  hash: {
    fontSize: 16,
    fontWeight: 700,
  },
  actionHeading: {
    marginTop: 26,
    marginBottom: -2,
    marginLeft: 4,
    color: '#8E8E93',
    fontSize: 17,
    fontWeight: 600,
  },
  actionCard: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: '#2C2C2E',
    overflow: 'hidden',
  },
  actionRow: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionName: {
    color: '#F2F2F2',
    fontSize: 17,
    fontWeight: 500,
  },
  actionSpacer: {
    flex: 1,
  },
  actionLine: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
    backgroundColor: '#3A3A3A',
  },
  bubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minusBar: {
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  plusWrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBar: {
    position: 'absolute',
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  plusBarVert: {
    width: 2,
    height: 10,
  },
  lockBubble: {
    width: 22,
    height: 22,
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
    width: 16,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: '#8E8E93',
  },
  navEdit: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navEditText: {
    color: '#F2F2F2',
    fontSize: 16,
    fontWeight: 600,
  },
  navDone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Night.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navHeading: {
    marginTop: 22,
    marginLeft: 4,
    color: '#8E8E93',
    fontSize: 17,
    fontWeight: 600,
  },
  navRow: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navName: {
    flex: 1,
    color: '#F2F2F2',
    fontSize: 17,
    fontWeight: 500,
  },
  navLine: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 46,
    backgroundColor: '#3A3A3C',
  },
  navPlus: {
    width: 22,
    color: Night.accent,
    fontSize: 22,
    fontWeight: 500,
    textAlign: 'center',
  },
  navAdd: {
    flex: 1,
    color: Night.accent,
    fontSize: 17,
    fontWeight: 600,
  },
  navFoot: {
    marginTop: 10,
    marginHorizontal: 4,
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
  navMenuHead: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navHide: {
    marginTop: 22,
    color: Night.accent,
    fontSize: 16,
    fontWeight: 700,
  },
  menuCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Night.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCheckOn: {
    backgroundColor: Night.accent,
  },
});
