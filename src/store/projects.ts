import { create } from 'zustand';

import { getDb } from '@/db/client';
import { migrateDb } from '@/db/migrate';
import { projectTable, taskTable } from '@/db/schema';

export type Project = {
  id: string;
  name: string;
  createdAt: string;
};

type ProjectState = {
  projects: Project[];
  ready: boolean;
  hydrate: () => Promise<void>;
  addProject: (name: string) => Promise<void>;
  clearProjects: () => Promise<void>;
  replaceProjects: (projects: Project[]) => Promise<void>;
};

let hydrating: Promise<void> | null = null;

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  ready: false,
  hydrate: () => {
    if (get().ready) return Promise.resolve();
    hydrating ??= loadProjects(set).finally(() => {
      hydrating = null;
    });
    return hydrating;
  },
  addProject: async (name) => {
    const nextName = name.trim();
    if (!nextName) throw new Error('Add a project name');
    if (get().projects.some((project) => project.name.toLowerCase() === nextName.toLowerCase())) {
      throw new Error('You already have this project');
    }
    const project: Project = {
      id: `project-${Date.now()}`,
      name: nextName,
      createdAt: new Date().toISOString(),
    };
    const db = await getDb();
    db.insert(projectTable).values(project).run();
    set({ projects: sortProjects([project, ...get().projects]) });
  },
  clearProjects: async () => {
    const db = await getDb();
    db.delete(projectTable).run();
    set({ projects: [] });
  },
  replaceProjects: async (projects) => {
    const unique = dedupeProjects(projects);
    const db = await getDb();
    db.delete(projectTable).run();
    for (const project of unique) {
      db.insert(projectTable).values(project).run();
    }
    set({ projects: sortProjects(unique) });
  },
}));

export function useProjects() {
  const projects = useProjectStore((state) => state.projects);
  const addProject = useProjectStore((state) => state.addProject);
  return { projects, addProject };
}

export function projectsFromNames(names: string[]) {
  const now = new Date().toISOString();
  return dedupeProjects(
    names.map((name, index) => ({
      id: `project-${Date.now()}-${index}`,
      name,
      createdAt: now,
    })),
  );
}

async function loadProjects(set: (partial: Partial<ProjectState>) => void) {
  try {
    await migrateDb();
    const db = await getDb();
    let projects = db.select().from(projectTable).all().map(toProject);
    if (projects.length === 0) {
      const names = db
        .select({ project: taskTable.project })
        .from(taskTable)
        .all()
        .map((row) => row.project);
      const seeded = projectsFromNames(names);
      for (const project of seeded) {
        db.insert(projectTable).values(project).run();
      }
      projects = seeded;
    }
    set({ projects: sortProjects(projects), ready: true });
  } catch {
    set({ projects: [], ready: true });
  }
}

function toProject(row: typeof projectTable.$inferSelect): Project {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
  };
}

function sortProjects(projects: Project[]) {
  return [...projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name));
}

function dedupeProjects(projects: Project[]) {
  const seen = new Set<string>();
  const unique: Project[] = [];
  for (const project of projects) {
    const name = project.name.trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    unique.push({ ...project, name });
  }
  return unique;
}
