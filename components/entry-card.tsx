"use client";

import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  ListVideo,
  Play,
} from "lucide-react";
import Link from "next/link";
import type { Entry } from "@/lib/types";
import { SECTION_LABEL } from "@/lib/types";
import { currentMilestoneLabel, entryProgress } from "@/lib/store";
import { ProgressBar } from "./progress-bar";

function PlaceholderIcon({ section }: { section: Entry["section"] }) {
  if (section === "books") {
    return <BookOpen className="h-14 w-14" strokeWidth={1.25} />;
  }
  if (section === "videos") {
    return <Play className="h-14 w-14" strokeWidth={1.25} />;
  }
  return <ListVideo className="h-14 w-14" strokeWidth={1.25} />;
}

export function EntryCard({
  entry,
  onMarkDone,
  onStart,
  disabledReason,
}: {
  entry: Entry;
  onMarkDone: () => void;
  onStart: () => void;
  disabledReason?: string | null;
}) {
  const { done, total } = entryProgress(entry);
  const pctLabel = `${done} / ${total}`;
  const current = currentMilestoneLabel(entry);
  const kindBadge =
    entry.section === "playlistsCourses" && entry.kind ? (
      <span className="inline-flex items-center gap-1 rounded-md bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary/80">
        {entry.kind === "course" ? (
          <GraduationCap className="h-3 w-3" />
        ) : (
          <ListVideo className="h-3 w-3" />
        )}
        {entry.kind === "course" ? "Course" : "Playlist"}
      </span>
    ) : null;

  return (
    <article className="group flex w-[min(100%,280px)] shrink-0 flex-col overflow-hidden rounded-2xl border border-primary/12 bg-card shadow-sm transition hover:border-primary/22 hover:shadow-md">
      <Link
        href={`/?id=${entry.id}`}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-primary/5"
      >
        {entry.imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.imageDataUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/25">
            <PlaceholderIcon section={entry.section} />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-primary/50">
              {SECTION_LABEL[entry.section]}
            </span>
            {kindBadge}
          </div>
          <Link href={`/?id=${entry.id}`}>
            <h3 className="font-heading text-base font-semibold leading-snug text-primary transition group-hover:text-primary/90">
              {entry.title}
            </h3>
          </Link>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-primary/55">
            <span>Progress</span>
            <span>{pctLabel}</span>
          </div>
          <ProgressBar value={done} max={total} />
        </div>

        <div className="rounded-xl bg-primary/[0.04] px-3 py-2 text-xs text-primary/75">
          <span className="block text-[10px] uppercase tracking-wide text-primary/45">
            Current
          </span>
          <span className="line-clamp-2 font-medium">{current}</span>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-1">
          {entry.status === "completed" ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--accent-success)]/35 bg-[var(--accent-success)]/12 py-2.5 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4 text-[var(--accent-success)]" />
              Completed
            </div>
          ) : entry.status === "active" ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onMarkDone();
              }}
              className="rounded-xl bg-primary py-2.5 text-sm font-medium text-[var(--on-primary)] transition hover:bg-primary/90"
            >
              Mark done
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              disabled={!!disabledReason}
              title={disabledReason ?? undefined}
              className="rounded-xl border border-primary/20 bg-transparent py-2.5 text-sm font-medium text-primary transition hover:border-primary/35 hover:bg-primary/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {disabledReason ? "Another item active" : "Start"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
