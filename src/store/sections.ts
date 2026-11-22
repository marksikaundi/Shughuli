import { create } from 'zustand';

import { getDb } from '@/db/client';
import { migrateDb } from '@/db/migrate';
import { sectionTable } from '@/db/schema';

export type Section = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

type SectionState = {
  sections: Section[];
  ready: boolean;
  hydrate: () => Promise<void>;
  addSection: (name: string, description: string) => Promise<void>;
};

let hydrating: Promise<void> | null = null;

export const useSectionStore = create<SectionState>((set, get) => ({
  sections: [],
  ready: false,
  hydrate: () => {
    if (get().ready) return Promise.resolve();
    hydrating ??= loadSections(set).finally(() => {
      hydrating = null;
    });
    return hydrating;
  },
  addSection: async (name, description) => {
    const nextName = name.trim();
    if (!nextName) return;
    const section: Section = {
      id: `section-${Date.now()}`,
      name: nextName,
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };
    const db = await getDb();
    db.insert(sectionTable).values(section).run();
    set({ sections: [...get().sections, section] });
  },
}));

export function useSections() {
  const sections = useSectionStore((state) => state.sections);
  const addSection = useSectionStore((state) => state.addSection);
  return { sections, addSection };
}

async function loadSections(set: (partial: Partial<SectionState>) => void) {
  await migrateDb();
  const db = await getDb();
  const sections = db
    .select()
    .from(sectionTable)
    .all()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  set({ sections, ready: true });
}
