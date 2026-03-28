"use client";

import type { Section } from "@/lib/types";
import { SECTION_LABEL } from "@/lib/types";
import {
  entriesBySection,
  useProgressStore,
} from "@/lib/store";
import { DataTools } from "./data-tools";
import { EntryCard } from "./entry-card";
import { ThemeToggle } from "./theme-toggle";

const SECTIONS: Section[] = ["books", "videos", "playlistsCourses"];

export function HomeView({
  onCreateClick,
}: {
  onCreateClick: () => void;
}) {
  const entries = useProgressStore((s) => s.entries);
  const startEntry = useProgressStore((s) => s.startEntry);
  const completeCurrentMilestone = useProgressStore(
    (s) => s.completeCurrentMilestone,
  );
  const getActiveInSection = useProgressStore((s) => s.getActiveInSection);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8 lg:px-10">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Progress Tracker
          </h1>
          <p className="mt-1 text-sm text-primary/55">
            One focus per category. Complete chapters in order.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={onCreateClick}
            className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-[var(--on-primary)] shadow-sm transition hover:bg-primary/90"
          >
            Create new
          </button>
        </div>
      </header>

      <section className="space-y-10">
        <h2 className="font-heading text-lg font-semibold text-primary/80">
          Collection
        </h2>

        {SECTIONS.map((section) => {
          const list = entriesBySection(entries, section);
          const active = getActiveInSection(section);
          return (
            <div key={section} className="space-y-4">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-primary/50">
                  {SECTION_LABEL[section]}
                </h3>
                <span className="text-xs text-primary/40">
                  {list.length} item{list.length === 1 ? "" : "s"}
                </span>
              </div>
              {list.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-primary/15 bg-card/50 px-5 py-8 text-center text-sm text-primary/45">
                  Nothing here yet. Use Create new to add{" "}
                  {SECTION_LABEL[section].toLowerCase()}.
                </p>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {list.map((entry) => {
                    const otherActive =
                      active && active.id !== entry.id ? active : null;
                    const disabledReason =
                      entry.status === "not_started" && otherActive
                        ? `Finish “${otherActive.title}” first, or delete it.`
                        : null;
                    return (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        disabledReason={disabledReason}
                        onStart={() => {
                          const r = startEntry(entry.id);
                          if (!r.ok && "reason" in r) {
                            window.alert(r.reason);
                          }
                        }}
                        onMarkDone={() => {
                          completeCurrentMilestone(entry.id);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <div className="mt-14">
        <DataTools />
      </div>
    </div>
  );
}
