import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Entry,
  EntryStatus,
  Milestone,
  PlaylistCourseKind,
  Section,
} from "./types";

function now() {
  return Date.now();
}

function sortMilestones(m: Milestone[]) {
  return [...m].sort((a, b) => a.order - b.order);
}

export interface ProgressState {
  entries: Entry[];
  addEntry: (input: {
    section: Section;
    title: string;
    kind?: PlaylistCourseKind;
    notes?: string;
    imageDataUrl?: string;
    milestoneTitles: string[];
  }) => string;
  updateEntry: (
    id: string,
    patch: Partial<Pick<Entry, "title" | "notes" | "imageDataUrl" | "kind">> & {
      milestoneTitles?: string[];
    },
  ) => void;
  removeEntry: (id: string) => void;
  startEntry: (id: string) => { ok: true } | { ok: false; reason: string };
  completeCurrentMilestone: (id: string) => void;
  getActiveInSection: (section: Section) => Entry | undefined;
  canStart: (id: string) => boolean;
  bulkAddFromImport: (
    items: Array<{
      section: Section;
      title: string;
      kind?: PlaylistCourseKind;
      notes?: string;
      milestoneTitles: string[];
    }>,
  ) => void;
  replaceAllEntries: (entries: Entry[]) => void;
}

function emptyMilestones(titles: string[]): Milestone[] {
  return titles.map((title, i) => ({
    id: crypto.randomUUID(),
    title: title.trim() || `Item ${i + 1}`,
    order: i,
    completed: false,
  }));
}

function renumberOrders(milestones: Milestone[]) {
  return sortMilestones(milestones).map((m, i) => ({ ...m, order: i }));
}

const initialEntries: Entry[] = [];

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      entries: initialEntries,

      addEntry: ({ section, title, kind, notes, imageDataUrl, milestoneTitles }) => {
        const id = crypto.randomUUID();
        const t = now();
        const titles =
          milestoneTitles.length > 0 ? milestoneTitles : ["Chapter 1"];
        const entry: Entry = {
          id,
          section,
          title: title.trim() || "Untitled",
          kind: section === "playlistsCourses" ? kind ?? "course" : undefined,
          notes,
          imageDataUrl,
          milestones: emptyMilestones(titles),
          status: "not_started",
          createdAt: t,
          updatedAt: t,
        };
        set((s) => ({ entries: [...s.entries, entry] }));
        return id;
      },

      updateEntry: (id, patch) => {
        set((s) => ({
          entries: s.entries.map((e) => {
            if (e.id !== id) return e;
            const t = now();
            let milestones = e.milestones;
            if (patch.milestoneTitles) {
              const sorted = sortMilestones(e.milestones);
              const next = patch.milestoneTitles.map((title, i) => {
                const prev = sorted[i];
                return {
                  id: prev?.id ?? crypto.randomUUID(),
                  title: title.trim() || `Item ${i + 1}`,
                  order: i,
                  completed: prev?.completed ?? false,
                } satisfies Milestone;
              });
              milestones = renumberOrders(next);
            }
            return {
              ...e,
              ...("title" in patch && patch.title !== undefined
                ? { title: patch.title }
                : {}),
              ...("notes" in patch && patch.notes !== undefined
                ? { notes: patch.notes }
                : {}),
              ...("imageDataUrl" in patch && patch.imageDataUrl !== undefined
                ? { imageDataUrl: patch.imageDataUrl }
                : {}),
              ...("kind" in patch && patch.kind !== undefined
                ? { kind: patch.kind }
                : {}),
              milestones,
              updatedAt: t,
            };
          }),
        }));
      },

      removeEntry: (id) => {
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
      },

      getActiveInSection: (section) => {
        return get().entries.find(
          (e) => e.section === section && e.status === "active",
        );
      },

      canStart: (id) => {
        const e = get().entries.find((x) => x.id === id);
        if (!e || e.status !== "not_started") return false;
        const active = get().getActiveInSection(e.section);
        return !active;
      },

      startEntry: (id) => {
        const entries = get().entries;
        const e = entries.find((x) => x.id === id);
        if (!e) return { ok: false, reason: "Not found" };
        if (e.status === "active") return { ok: true };
        if (e.status === "completed")
          return { ok: false, reason: "Already completed" };
        const active = get().getActiveInSection(e.section);
        if (active && active.id !== id) {
          return {
            ok: false,
            reason: `Finish “${active.title}” first, or delete it to switch.`,
          };
        }
        const t = now();
        set({
          entries: entries.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status: "active" as EntryStatus,
                  milestones: sortMilestones(x.milestones).map((m, i) => ({
                    ...m,
                    completed: false,
                    order: i,
                  })),
                  updatedAt: t,
                }
              : x,
          ),
        });
        return { ok: true };
      },

      bulkAddFromImport: (items) => {
        for (const item of items) {
          get().addEntry(item);
        }
      },

      replaceAllEntries: (entries) => {
        set({ entries });
      },

      completeCurrentMilestone: (id) => {
        const entries = get().entries;
        const e = entries.find((x) => x.id === id);
        if (!e || e.status !== "active") return;
        const ordered = sortMilestones(e.milestones);
        const nextIdx = ordered.findIndex((m) => !m.completed);
        if (nextIdx === -1) {
          const t = now();
          set({
            entries: entries.map((x) =>
              x.id === id
                ? { ...x, status: "completed" as EntryStatus, updatedAt: t }
                : x,
            ),
          });
          return;
        }
        const t = now();
        const updated = ordered.map((m, i) =>
          i === nextIdx ? { ...m, completed: true } : m,
        );
        const allDone = updated.every((m) => m.completed);
        set({
          entries: entries.map((x) => {
            if (x.id !== id) return x;
            return {
              ...x,
              milestones: renumberOrders(updated),
              status: allDone ? ("completed" as EntryStatus) : x.status,
              updatedAt: t,
            };
          }),
        });
      },
    }),
    {
      name: "progress-tracker-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ entries: s.entries }),
    },
  ),
);

export function entryProgress(e: Entry): { done: number; total: number } {
  const total = e.milestones.length;
  const done = sortMilestones(e.milestones).filter((m) => m.completed).length;
  return { done, total: Math.max(total, 1) };
}

export function currentMilestoneLabel(e: Entry): string {
  if (e.status === "completed") return "Completed";
  const ordered = sortMilestones(e.milestones);
  const next = ordered.find((m) => !m.completed);
  return next?.title ?? "—";
}

export function entriesBySection(entries: Entry[], section: Section) {
  return entries.filter((e) => e.section === section);
}
