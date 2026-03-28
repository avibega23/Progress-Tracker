import type { Entry, PlaylistCourseKind, Section } from "./types";

const SECTIONS: Section[] = ["books", "videos", "playlistsCourses"];

export type BulkImportItem = {
  section: Section;
  title: string;
  kind?: PlaylistCourseKind;
  notes?: string;
  /** Chapter / episode / lesson titles, in order */
  milestoneTitles: string[];
};

function isSection(s: unknown): s is Section {
  return typeof s === "string" && SECTIONS.includes(s as Section);
}

function isPlaylistKind(k: unknown): k is PlaylistCourseKind {
  return k === "playlist" || k === "course";
}

export function parseBulkItem(raw: unknown): BulkImportItem {
  if (!raw || typeof raw !== "object") {
    throw new Error("Each entry must be an object.");
  }
  const o = raw as Record<string, unknown>;
  if (!isSection(o.section)) {
    throw new Error(
      `Invalid section (use one of: ${SECTIONS.join(", ")}).`,
    );
  }
  if (typeof o.title !== "string" || !o.title.trim()) {
    throw new Error("Each entry needs a non-empty title.");
  }
  if (!Array.isArray(o.milestoneTitles)) {
    throw new Error("Each entry needs milestoneTitles: string[].");
  }
  const titles = o.milestoneTitles
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter(Boolean);
  if (titles.length === 0) {
    throw new Error("milestoneTitles must have at least one non-empty string.");
  }
  const item: BulkImportItem = {
    section: o.section,
    title: o.title.trim(),
    milestoneTitles: titles,
  };
  if (typeof o.notes === "string" && o.notes.trim()) {
    item.notes = o.notes.trim();
  }
  if (o.section === "playlistsCourses" && o.kind !== undefined) {
    if (!isPlaylistKind(o.kind)) {
      throw new Error('For playlists & courses, kind must be "playlist" or "course".');
    }
    item.kind = o.kind;
  }
  return item;
}

function isFullEntry(raw: unknown): raw is Entry {
  if (!raw || typeof raw !== "object") return false;
  const e = raw as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    isSection(e.section) &&
    typeof e.title === "string" &&
    Array.isArray(e.milestones) &&
    typeof e.status === "string" &&
    typeof e.createdAt === "number" &&
    typeof e.updatedAt === "number"
  );
}

/** Detects Export backup (full Entry[]) vs bulk-add shape. */
export function parseImportFile(
  data: unknown,
): { mode: "bulk"; items: BulkImportItem[] } | { mode: "restore"; entries: Entry[] } {
  if (!Array.isArray(data)) {
    throw new Error("File must contain a JSON array.");
  }
  if (data.length === 0) {
    return { mode: "bulk", items: [] };
  }
  if (data.every(isFullEntry)) {
    return { mode: "restore", entries: data as Entry[] };
  }
  return { mode: "bulk", items: data.map(parseBulkItem) };
}

export const BULK_IMPORT_EXAMPLE: BulkImportItem[] = [
  {
    section: "books",
    title: "Example book",
    notes: "Optional note",
    milestoneTitles: ["Chapter 1", "Chapter 2", "Chapter 3"],
  },
  {
    section: "videos",
    title: "Example video series",
    milestoneTitles: ["Part 1", "Part 2"],
  },
  {
    section: "playlistsCourses",
    kind: "course",
    title: "Example course",
    milestoneTitles: ["Lesson 1", "Lesson 2"],
  },
];
