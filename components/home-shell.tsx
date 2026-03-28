"use client";

import dynamic from "next/dynamic";

const AppClient = dynamic(
  () => import("@/components/app-client").then((m) => m.AppClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24">
        <div className="h-9 w-9 animate-pulse rounded-xl bg-primary/15" />
        <p className="text-sm text-primary/45">Loading…</p>
      </div>
    ),
  },
);

export function HomeShell() {
  return <AppClient />;
}
