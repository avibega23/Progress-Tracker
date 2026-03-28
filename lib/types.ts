export type Section = "books" | "videos" | "playlistsCourses";

export type PlaylistCourseKind = "playlist" | "course";

export type EntryStatus = "not_started" | "active" | "completed";

export interface Milestone {
  id: string;
  title: string;
  order: number;
  completed: boolean;
}

export interface Entry {
  id: string;
  section: Section;
  /** Only used when section === "playlistsCourses" */
  kind?: PlaylistCourseKind;
  title: string;
  notes?: string;
  imageDataUrl?: string;
  milestones: Milestone[];
  status: EntryStatus;
  createdAt: number;
  updatedAt: number;
}

export const SECTION_LABEL: Record<Section, string> = {
  books: "Books",
  videos: "Videos",
  playlistsCourses: "Playlists & courses",
};
