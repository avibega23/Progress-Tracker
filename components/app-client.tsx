"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useProgressStore } from "@/lib/store";
import { DetailView } from "./detail-view";
import { EntryFormModal } from "./entry-form-modal";
import { HomeView } from "./home-view";

function AppBody() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const entries = useProgressStore((s) => s.entries);

  const entry = id ? entries.find((e) => e.id === id) : undefined;

  if (id && !entry) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <p className="font-heading text-lg font-semibold text-primary">
          Entry not found
        </p>
        <Link
          href="/"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-[var(--on-primary)]"
        >
          Back to collection
        </Link>
      </div>
    );
  }

  if (id && entry) {
    return (
      <>
        <DetailView entry={entry} onEdit={() => setEditOpen(true)} />
        <EntryFormModal
          open={editOpen}
          mode="edit"
          entry={entry}
          onClose={() => setEditOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <HomeView onCreateClick={() => setCreateOpen(true)} />
      <EntryFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}

export function AppClient() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center justify-center py-24">
          <p className="text-sm text-primary/45">Loading…</p>
        </div>
      }
    >
      <AppBody />
    </Suspense>
  );
}
