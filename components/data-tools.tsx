"use client";

import { Download, FileUp } from "lucide-react";
import { useRef, useState } from "react";
import {
  BULK_IMPORT_EXAMPLE,
  parseImportFile,
} from "@/lib/import-export";
import { useProgressStore } from "@/lib/store";

export function DataTools() {
  const entries = useProgressStore((s) => s.entries);
  const bulkAddFromImport = useProgressStore((s) => s.bulkAddFromImport);
  const replaceAllEntries = useProgressStore((s) => s.replaceAllEntries);
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `progress-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Backup downloaded.");
    window.setTimeout(() => setMessage(null), 3000);
  };

  const downloadExample = () => {
    const blob = new Blob([JSON.stringify(BULK_IMPORT_EXAMPLE, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "progress-tracker-bulk-import-example.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMessage(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;
      const parsed = parseImportFile(data);

      if (parsed.mode === "bulk") {
        if (parsed.items.length === 0) {
          setMessage("Nothing to import (empty array).");
          return;
        }
        bulkAddFromImport(parsed.items);
        setMessage(
          `Imported ${parsed.items.length} new ${parsed.items.length === 1 ? "entry" : "entries"}.`,
        );
        return;
      }

      const ok = window.confirm(
        `This file looks like a full backup (${parsed.entries.length} entries). Replace ALL current data on this device? This cannot be undone.`,
      );
      if (!ok) return;
      replaceAllEntries(parsed.entries);
      setMessage("Backup restored. Your previous list was replaced.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not read or parse the file.",
      );
    }
  };

  return (
    <div className="rounded-2xl border border-primary/12 bg-card/80 p-5">
      <h3 className="font-heading text-sm font-semibold text-primary/85">
        Bulk import & backup
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-primary/60">
        Add many books, videos, or courses at once with a JSON file, or download a
        backup of everything in this browser. Use the example file as a template:
        each item needs{" "}
        <code className="rounded bg-primary/8 px-1 py-0.5 text-xs">
          section
        </code>
        ,{" "}
        <code className="rounded bg-primary/8 px-1 py-0.5 text-xs">title</code>
        , and{" "}
        <code className="rounded bg-primary/8 px-1 py-0.5 text-xs">
          milestoneTitles
        </code>{" "}
        (chapter or episode names in order). Sections:{" "}
        <code className="text-xs">books</code>,{" "}
        <code className="text-xs">videos</code>,{" "}
        <code className="text-xs">playlistsCourses</code> (optional{" "}
        <code className="text-xs">kind</code>:{" "}
        <code className="text-xs">playlist</code> or{" "}
        <code className="text-xs">course</code>).
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportBackup}
          className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
        >
          <Download className="h-4 w-4" />
          Download backup
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
        >
          <FileUp className="h-4 w-4" />
          Import JSON…
        </button>
        <button
          type="button"
          onClick={downloadExample}
          className="rounded-xl px-4 py-2 text-sm font-medium text-primary/70 underline-offset-2 hover:underline"
        >
          Download example JSON
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onPickFile}
        />
      </div>
      {message ? (
        <p className="mt-3 text-sm text-primary/75" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
