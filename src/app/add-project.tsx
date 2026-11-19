import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { useProjects } from '@/data/projects';

export default function AddProjectScreen() {
  const insets = useSafeAreaInsets();
  const { addProject } = useProjects();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function leave() {
    if (router.canGoBack()) router.back();
    else router.replace('/projects');
  }

  async function save() {
    if (busy) return;
    const nextName = name.trim();
    if (!nextName) {
      setError('Add a project name');
      return;
    }
    setBusy(true);
    try {
      await addProject(nextName);
      leave();
    } catch (caught) {
      setBusy(false);
      setError(caught instanceof Error ? caught.message : 'Could not save this project on the device.');
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={[
            styles.body,
            {
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 28,
              paddingHorizontal: Layout.padding,
            },
          ]}>
          <View style={styles.header}>
            <IconButton icon="close" accessibilityLabel="Close" onPress={leave} />
            <Text style={styles.headerTitle}>New Project</Text>
            <IconButton icon="check" accessibilityLabel="Save project" onPress={save} />
          </View>

          <Text style={styles.lead}>Name a project you’re working on. Tasks can be added to it when you create them.</Text>

          <Text style={styles.label}>Project name</Text>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (error) setError('');
            }}
            placeholder="Project you’re working on"
            placeholderTextColor={Palette.faint}
            autoFocus
            style={styles.input}
            onSubmitEditing={save}
            returnKeyType="done"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={busy}
            style={({ pressed }) => [styles.create, pressed && styles.pressed]}
            onPress={save}>
            <Text style={styles.createText}>Create Project</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Palette.ink,
    fontSize: 18,
    fontWeight: 700,
  },
  lead: {
    marginTop: 28,
    color: Palette.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    marginTop: 22,
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    marginTop: 8,
    minHeight: 54,
    backgroundColor: Palette.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 600,
    ...cardShadow,
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  error: {
    marginTop: 8,
    color: Palette.danger,
    fontSize: 12,
    fontWeight: 600,
  },
  create: {
    marginTop: 28,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.85,
  },
});
