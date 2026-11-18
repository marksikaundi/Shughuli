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

export function countSavedNotes() {
  if (Platform.OS === 'web') return null;

  const folder = notesFolder();
  if (!folder.exists) return 0;
  return folder.list().length;
}
