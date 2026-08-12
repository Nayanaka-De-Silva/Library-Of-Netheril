import { createSignal } from "solid-js";
import { spellSummarySchema } from "../../shared/schemas";
import type { SpellSummary } from "../../shared/schemas";

export const RECENTLY_VIEWED_STORAGE_KEY = "recently-viewed-spells";
export const MAX_RECENTLY_VIEWED_SPELLS = 5;

// Hydrate from localStorage at import time, ignoring corrupt or mismatched stored data.
function loadFromStorage(): SpellSummary[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    const result = spellSummarySchema.array().safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

function saveToStorage(spells: SpellSummary[]): void {
  try {
    localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(spells));
  } catch {
    // Ignore — quota exceeded or private browsing blocks writes; in-memory state is still valid.
  }
}

const [recentlyViewedSpells, setRecentlyViewedSpells] = createSignal<SpellSummary[]>(loadFromStorage());

export { recentlyViewedSpells };

// Records a spell view: moves it to the front, de-dupes by id, caps at MAX_RECENTLY_VIEWED_SPELLS.
export function recordSpellView(spell: SpellSummary): void {
  // Early exit when the spell is already at the front — avoids a redundant signal write and persist.
  if (recentlyViewedSpells()[0]?.id === spell.id) return;

  const updated = [spell, ...recentlyViewedSpells().filter((s) => s.id !== spell.id)].slice(
    0,
    MAX_RECENTLY_VIEWED_SPELLS,
  );

  setRecentlyViewedSpells(updated);
  saveToStorage(updated);
}

// Removes a spell by id from the recently-viewed list and re-persists.
// Symmetrical to recordSpellView; call this when a custom spell is deleted.
export function forgetSpellView(id: string): void {
  const updated = recentlyViewedSpells().filter((s) => s.id !== id);
  setRecentlyViewedSpells(updated);
  saveToStorage(updated);
}

// Resets both the in-memory signal and localStorage entry — for use in tests only.
export function __resetRecentlyViewedForTests(): void {
  setRecentlyViewedSpells([]);
  try {
    localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
  } catch {
    // Ignore storage errors during test cleanup.
  }
}
