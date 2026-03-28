"use client";

import { ArrowLeft, CheckCircle2, Circle, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { Entry } from "@/lib/types";
import { SECTION_LABEL } from "@/lib/types";
import {
  currentMilestoneLabel,
  entryProgress,
  useProgressStore,
} from "@/lib/store";
import { GithubSourceLink } from "./github-source-link";
import { ProgressBar } from "./progress-bar";
import { ThemeToggle } from "./theme-toggle";

function sortMilestones(entry: Entry) {
  return [...entry.milestones].sort((a, b) => a.order - b.order);
}

export function DetailView({
  entry,
  onEdit,
}: {
  entry: Entry;
  onEdit: () => void;
}) {
  const router = useRouter();
  const completeCurrentMilestone = useProgressStore(
    (s) => s.completeCurrentMilestone,
  );
  const startEntry = useProgressStore((s) => s.startEntry);
  const getActiveInSection = useProgressStore((s) => s.getActiveInSection);
  const removeEntry = useProgressStore((s) => s.removeEntry);

  const ordered = useMemo(() => sortMilestones(entry), [entry]);
  const { done, total } = entryProgress(entry);
  const activeInSection = getActiveInSection(entry.section);
  const blockStart =
    entry.status === "not_started" &&
    activeInSection &&
    activeInSection.id !== entry.id;

  const back = () => {
    router.push("/");
  };

  return (
    <div className="relative mx-auto w-full max-w-lg flex-1 px-5 pb-20 pt-6 sm:px-10 sm:pt-10 lg:px-16">
      <div className="fixed right-4 top-4 z-40 flex items-center gap-2 sm:right-6 sm:top-6">
        <GithubSourceLink />
        <ThemeToggle />
      </div>
      <button
        type="button"
        onClick={back}
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-primary/70 transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="overflow-hidden rounded-2xl border border-primary/12 bg-card shadow-sm">
        <div className="relative aspect-[16/10] w-full bg-primary/5">
          {entry.imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.imageDataUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-primary/20">
              <span className="text-sm">No image</span>
            </div>
          )}
        </div>
        <div className="space-y-3 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-primary/45">
                {SECTION_LABEL[entry.section]}
                {entry.kind
                  ? ` · ${entry.kind === "course" ? "Course" : "Playlist"}`
                  : ""}
              </p>
              <h1 className="font-heading text-2xl font-bold leading-tight text-primary">
                {entry.title}
              </h1>
            </div>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-primary/15 px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary/5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
          {entry.notes ? (
            <p className="text-sm leading-relaxed text-primary/65">
              {entry.notes}
            </p>
          ) : null}

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs text-primary/55">
              <span>Progress</span>
              <span>
                {done} / {total}
              </span>
            </div>
            <ProgressBar value={done} max={total} />
            <p className="text-sm text-primary/70">
              <span className="text-primary/45">Current: </span>
              {currentMilestoneLabel(entry)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="font-heading text-sm font-semibold text-primary/70">
          Chapters & milestones
        </h2>
        <ul className="space-y-2">
          {ordered.map((m, i) => {
            const isDone = m.completed;
            const isCurrent =
              entry.status === "active" &&
              !isDone &&
              ordered.slice(0, i).every((x) => x.completed);
            return (
              <li
                key={m.id}
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                  isCurrent
                    ? "border-[var(--accent-success)]/40 bg-[var(--accent-success)]/10"
                    : "border-primary/10 bg-card"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-success)]" />
                ) : (
                  <Circle
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      isCurrent ? "text-[var(--accent-success)]" : "text-primary/25"
                    }`}
                    strokeWidth={1.75}
                  />
                )}
                <span
                  className={
                    isDone ? "text-primary/55 line-through" : "text-primary"
                  }
                >
                  {m.title}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        {entry.status === "completed" ? (
          <div className="rounded-2xl border border-[var(--accent-success)]/35 bg-[var(--accent-success)]/10 py-4 text-center text-sm font-medium text-primary">
            All milestones completed
          </div>
        ) : entry.status === "active" ? (
          <button
            type="button"
            onClick={() => completeCurrentMilestone(entry.id)}
            className="rounded-2xl bg-primary py-3.5 text-sm font-semibold text-[var(--on-primary)] transition hover:bg-primary/90"
          >
            Mark current done
          </button>
        ) : (
          <button
            type="button"
            disabled={!!blockStart}
            title={
              blockStart
                ? `Finish “${activeInSection?.title}” first, or delete it.`
                : undefined
            }
            onClick={() => {
              const r = startEntry(entry.id);
              if (!r.ok && "reason" in r) {
                window.alert(r.reason);
              }
            }}
            className="rounded-2xl border border-primary/20 py-3.5 text-sm font-semibold text-primary transition hover:bg-primary/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {blockStart ? "Another item active in this category" : "Start"}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                `Delete “${entry.title}”? This cannot be undone.`,
              )
            ) {
              removeEntry(entry.id);
              router.push("/");
            }
          }}
          className="rounded-2xl py-3 text-sm font-medium text-[var(--destructive)] transition hover:bg-[var(--destructive)]/8"
        >
          Delete entry
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-primary/35">
        <Link href="/" className="underline-offset-2 hover:underline">
          Back to collection
        </Link>
      </p>
    </div>
  );
}
