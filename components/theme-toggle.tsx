"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";

export function ThemeToggle() {
  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem("pt-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    root.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    localStorage.setItem("pt-theme", next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-card text-primary transition hover:border-primary/25 hover:bg-primary/5"
      aria-label="Toggle theme"
    >
      <Sun className="hidden h-[18px] w-[18px] dark:block" strokeWidth={1.75} />
      <Moon className="h-[18px] w-[18px] dark:hidden" strokeWidth={1.75} />
    </button>
  );
}
