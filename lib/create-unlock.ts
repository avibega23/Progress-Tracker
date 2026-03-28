/**
 * Remembers successful "create" unlock on this browser via localStorage.
 * Stores a fingerprint of the env password (not the password itself) so
 * changing NEXT_PUBLIC_CREATE_PASSWORD clears the remembered state.
 */

const STORAGE_KEY = "pt-create-unlock-v1";

function unlockTokenFromEnv(): string {
  const p = process.env.NEXT_PUBLIC_CREATE_PASSWORD ?? "";
  if (!p) return "";
  let h = 2166136261;
  for (let i = 0; i < p.length; i++) {
    h ^= p.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return String(h >>> 0);
}

export function isCreateUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  const expected = unlockTokenFromEnv();
  if (!expected) return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === expected;
  } catch {
    return false;
  }
}

export function persistCreateUnlock(): void {
  const token = unlockTokenFromEnv();
  if (!token) return;
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    /* ignore quota / private mode */
  }
}
