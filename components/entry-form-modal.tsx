"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { Entry, PlaylistCourseKind, Section } from "@/lib/types";
import { SECTION_LABEL } from "@/lib/types";
import { isCreateUnlocked, persistCreateUnlock } from "@/lib/create-unlock";
import { useProgressStore } from "@/lib/store";

const SECTION_OPTIONS: Section[] = ["books", "videos", "playlistsCourses"];

const MAX_IMAGE_BYTES = 1_200_000;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function milestoneLinesFromEntry(entry: Entry | null | undefined): string[] {
  if (!entry) return ["", "", ""];
  const sorted = [...entry.milestones].sort((a, b) => a.order - b.order);
  return sorted.length ? sorted.map((m) => m.title) : [""];
}

function EntryFormModalInner({
  mode,
  entry,
  onClose,
}: {
  mode: "create" | "edit";
  entry?: Entry | null;
  onClose: () => void;
}) {
  const addEntry = useProgressStore((s) => s.addEntry);
  const updateEntry = useProgressStore((s) => s.updateEntry);

  const [step, setStep] = useState<"password" | "form">(() => {
    if (mode !== "create") return "form";
    return isCreateUnlocked() ? "form" : "password";
  });
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);

  const [section, setSection] = useState<Section>(
    () => entry?.section ?? "books",
  );
  const [kind, setKind] = useState<PlaylistCourseKind>(
    () => entry?.kind ?? "course",
  );
  const [title, setTitle] = useState(() => entry?.title ?? "");
  const [notes, setNotes] = useState(() => entry?.notes ?? "");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(
    () => entry?.imageDataUrl,
  );
  const [milestoneLines, setMilestoneLines] = useState<string[]>(() =>
    milestoneLinesFromEntry(entry ?? undefined),
  );
  const [formError, setFormError] = useState<string | null>(null);

  const expectedPw = process.env.NEXT_PUBLIC_CREATE_PASSWORD ?? "";

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedPw) {
      setPwError(
        "Set NEXT_PUBLIC_CREATE_PASSWORD in .env.local and restart the dev server.",
      );
      return;
    }
    if (password !== expectedPw) {
      setPwError("Incorrect password.");
      return;
    }
    persistCreateUnlock();
    setPwError(null);
    setStep("form");
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const titles = milestoneLines.map((t) => t.trim()).filter(Boolean);
    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (titles.length === 0) {
      setFormError("Add at least one chapter or milestone.");
      return;
    }
    if (mode === "create") {
      addEntry({
        section,
        title: title.trim(),
        kind: section === "playlistsCourses" ? kind : undefined,
        notes: notes.trim() || undefined,
        imageDataUrl,
        milestoneTitles: titles,
      });
    } else if (entry) {
      updateEntry(entry.id, {
        title: title.trim(),
        notes: notes.trim() || undefined,
        imageDataUrl,
        kind: entry.section === "playlistsCourses" ? kind : undefined,
        milestoneTitles: titles,
      });
    }
    onClose();
  };

  const onImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setFormError("Image is too large (max ~1.2MB for local storage).");
      return;
    }
    try {
      const url = await readFileAsDataUrl(file);
      setImageDataUrl(url);
      setFormError(null);
    } catch {
      setFormError("Could not read image.");
    }
  };

  const sectionForPlaylists =
    mode === "edit" && entry ? entry.section : section;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] transition"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-primary/12 bg-[var(--modal-bg)] p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-heading text-xl font-semibold text-primary">
            {mode === "create" ? "Create entry" : "Edit entry"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-primary/50 transition hover:bg-primary/8 hover:text-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === "create" && step === "password" ? (
          <form onSubmit={submitPassword} className="space-y-4">
            <p className="text-sm text-primary/65">
              Enter the password from your environment to add an entry.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-primary/15 bg-card px-4 py-3 text-sm text-primary outline-none ring-primary/20 focus:ring-2"
              placeholder="Password"
              autoComplete="off"
            />
            {pwError ? (
              <p className="text-sm text-[var(--destructive)]">{pwError}</p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-[var(--on-primary)]"
            >
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={submitForm} className="space-y-4">
            {mode === "create" ? (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-primary/55">
                  Category
                </span>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value as Section)}
                  className="w-full rounded-xl border border-primary/15 bg-card px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {SECTION_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {SECTION_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="text-xs text-primary/50">
                Category:{" "}
                <span className="font-medium text-primary/80">
                  {entry ? SECTION_LABEL[entry.section] : ""}
                </span>{" "}
                (fixed)
              </p>
            )}

            {sectionForPlaylists === "playlistsCourses" && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-primary/55">
                  Type
                </span>
                <select
                  value={kind}
                  onChange={(e) =>
                    setKind(e.target.value as PlaylistCourseKind)
                  }
                  className="w-full rounded-xl border border-primary/15 bg-card px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="playlist">Playlist</option>
                  <option value="course">Course</option>
                </select>
              </label>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-primary/55">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-primary/15 bg-card px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Name"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-primary/55">
                Notes (optional)
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl border border-primary/15 bg-card px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Short description"
              />
            </label>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-primary/55">
                Cover image
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="w-full text-sm text-primary/80 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-medium file:text-primary"
              />
              {imageDataUrl ? (
                <button
                  type="button"
                  onClick={() => setImageDataUrl(undefined)}
                  className="text-xs font-medium text-[var(--destructive)]"
                >
                  Remove image
                </button>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary/55">
                  Chapters / milestones
                </span>
                <button
                  type="button"
                  onClick={() => setMilestoneLines((m) => [...m, ""])}
                  className="text-xs font-medium text-primary/70 underline-offset-2 hover:underline"
                >
                  Add line
                </button>
              </div>
              <div className="space-y-2">
                {milestoneLines.map((line, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={line}
                      onChange={(e) => {
                        const v = e.target.value;
                        setMilestoneLines((prev) => {
                          const next = [...prev];
                          next[i] = v;
                          return next;
                        });
                      }}
                      className="min-w-0 flex-1 rounded-xl border border-primary/15 bg-card px-3 py-2 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder={`Chapter ${i + 1}`}
                    />
                    {milestoneLines.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setMilestoneLines((prev) =>
                            prev.filter((_, j) => j !== i),
                          )
                        }
                        className="shrink-0 rounded-lg px-2 text-xs text-[var(--destructive)]"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {formError ? (
              <p className="text-sm text-[var(--destructive)]">{formError}</p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-[var(--on-primary)]"
            >
              {mode === "create" ? "Create" : "Save changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function EntryFormModal({
  open,
  mode,
  entry,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  entry?: Entry | null;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <EntryFormModalInner
      key={mode === "edit" && entry ? entry.id : "create"}
      mode={mode}
      entry={entry}
      onClose={onClose}
    />
  );
}
