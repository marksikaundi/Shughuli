import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { Task } from '@/data/model';

const notesFolder = () => new Directory(Paths.document, 'shughuli', 'notes');

export function saveTaskNote(task: Task) {
  if (Platform.OS === 'web') return null;

  const folder = notesFolder();
  if (!folder.exists) {
    folder.create({ intermediates: true, idempotent: true });
  }

  const file = new File(folder, `${task.id}.txt`);
  if (!file.exists) {
    file.create();
  }
  file.writeSync(
    `${task.title}\n${task.date} ${task.start}–${task.end}\n${task.project}\n\n${task.description}\n`,
  );
  return file.uri;
}

export function deleteTaskNote(id: string) {
  if (Platform.OS === 'web') return;

  try {
    const file = new File(notesFolder(), `${id}.txt`);
    if (file.exists) file.delete();
  } catch {
    // A missing note should not block opening the task list.
  }
}

export function countSavedNotes() {
  if (Platform.OS === 'web') return null;

  const folder = notesFolder();
  if (!folder.exists) return 0;
  return folder.list().filter((item) => item instanceof File).length;
}

export function readAllNotes() {
  if (Platform.OS === 'web') return [];

  const folder = notesFolder();
  if (!folder.exists) return [];
  return folder.list().flatMap((item) => {
    if (!(item instanceof File) || !item.name.endsWith('.txt')) return [];
    try {
      return [{ id: item.name.replace(/\.txt$/, ''), text: item.textSync() }];
    } catch {
      return [];
    }
  });
}

export function writeNoteContents(id: string, text: string) {
  if (Platform.OS === 'web') return;

  const folder = notesFolder();
  if (!folder.exists) folder.create({ intermediates: true, idempotent: true });
  const file = new File(folder, `${id}.txt`);
  if (!file.exists) file.create();
  file.writeSync(text);
}

export function deleteAllNotes() {
  if (Platform.OS === 'web') return;

  const folder = notesFolder();
  if (!folder.exists) return;
  for (const item of folder.list()) {
    try {
      item.delete();
    } catch {
      // Keep clearing the rest of the folder.
    }
  }
}
