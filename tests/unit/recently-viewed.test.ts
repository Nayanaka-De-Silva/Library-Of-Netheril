// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Dynamic import via vi.resetModules() simulates a fresh page load to test localStorage persistence.
async function importStore() {
  const mod = await import("../../src/client/lib/recentlyViewed");
  return mod;
}

describe("recently viewed spells store", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("starts with an empty list", async () => {
    const { recentlyViewedSpells } = await importStore();
    expect(recentlyViewedSpells()).toEqual([]);
  });

  it("records a spell view", async () => {
    const { recentlyViewedSpells, recordSpellView } = await importStore();
    recordSpellView({ id: "srd-fireball", name: "Fireball", level: 3, school: "Evocation" });
    expect(recentlyViewedSpells()).toHaveLength(1);
    expect(recentlyViewedSpells()[0].name).toBe("Fireball");
  });

  it("puts the most recently viewed spell first", async () => {
    const { recentlyViewedSpells, recordSpellView } = await importStore();
    recordSpellView({ id: "srd-fireball", name: "Fireball", level: 3, school: "Evocation" });
    recordSpellView({ id: "srd-shield", name: "Shield", level: 1, school: "Abjuration" });
    expect(recentlyViewedSpells()[0].name).toBe("Shield");
    expect(recentlyViewedSpells()[1].name).toBe("Fireball");
  });

  it("moves a re-viewed spell to the front without duplicating", async () => {
    const { recentlyViewedSpells, recordSpellView } = await importStore();
    recordSpellView({ id: "srd-fireball", name: "Fireball", level: 3, school: "Evocation" });
    recordSpellView({ id: "srd-shield", name: "Shield", level: 1, school: "Abjuration" });
    recordSpellView({ id: "srd-fireball", name: "Fireball", level: 3, school: "Evocation" });
    expect(recentlyViewedSpells()).toHaveLength(2);
    expect(recentlyViewedSpells()[0].id).toBe("srd-fireball");
  });

  it("caps the list at MAX_RECENTLY_VIEWED_SPELLS and drops the oldest", async () => {
    const { recentlyViewedSpells, recordSpellView, MAX_RECENTLY_VIEWED_SPELLS } = await importStore();
    for (let i = 0; i < MAX_RECENTLY_VIEWED_SPELLS + 2; i++) {
      recordSpellView({ id: `spell-${i}`, name: `Spell ${i}`, level: i % 10, school: "Evocation" });
    }
    expect(recentlyViewedSpells()).toHaveLength(MAX_RECENTLY_VIEWED_SPELLS);
    // The oldest entries are dropped; the most recent is first
    expect(recentlyViewedSpells()[0].id).toBe(`spell-${MAX_RECENTLY_VIEWED_SPELLS + 1}`);
  });

  it("persists across a simulated reload", async () => {
    const { recordSpellView } = await importStore();
    recordSpellView({ id: "srd-fireball", name: "Fireball", level: 3, school: "Evocation" });

    // Simulate a new page load by resetting modules and re-importing
    vi.resetModules();
    const { recentlyViewedSpells: reloadedSpells } = await importStore();
    expect(reloadedSpells()).toHaveLength(1);
    expect(reloadedSpells()[0].name).toBe("Fireball");
  });

  it("ignores corrupt JSON in localStorage rather than throwing", async () => {
    localStorage.setItem("recently-viewed-spells", "this is not json{{{");
    const { recentlyViewedSpells } = await importStore();
    expect(recentlyViewedSpells()).toEqual([]);
  });

  it("ignores mismatched stored JSON (wrong shape) rather than throwing", async () => {
    localStorage.setItem("recently-viewed-spells", JSON.stringify([{ wrong: "shape" }]));
    const { recentlyViewedSpells } = await importStore();
    expect(recentlyViewedSpells()).toEqual([]);
  });

  it("does not crash when localStorage.setItem throws (private browsing / quota)", async () => {
    const { recordSpellView, recentlyViewedSpells } = await importStore();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    expect(() =>
      recordSpellView({ id: "srd-fireball", name: "Fireball", level: 3, school: "Evocation" }),
    ).not.toThrow();

    // The in-memory signal is still updated even if persistence failed
    expect(recentlyViewedSpells()).toHaveLength(1);

    vi.restoreAllMocks();
  });

  // forgetSpellView — removal
  it("removes a present entry from the list", async () => {
    const { recentlyViewedSpells, recordSpellView, forgetSpellView } = await importStore();
    recordSpellView({ id: "srd-fireball", name: "Fireball", level: 3, school: "Evocation" });
    recordSpellView({ id: "srd-shield", name: "Shield", level: 1, school: "Abjuration" });

    forgetSpellView("srd-fireball");

    expect(recentlyViewedSpells()).toHaveLength(1);
    expect(recentlyViewedSpells()[0].id).toBe("srd-shield");
  });

  it("is a no-op when the id is not in the list", async () => {
    const { recentlyViewedSpells, forgetSpellView } = await importStore();

    expect(() => forgetSpellView("nonexistent")).not.toThrow();
    expect(recentlyViewedSpells()).toEqual([]);
  });

  it("persists the removal to localStorage", async () => {
    const { recordSpellView, forgetSpellView } = await importStore();
    recordSpellView({ id: "srd-fireball", name: "Fireball", level: 3, school: "Evocation" });
    forgetSpellView("srd-fireball");

    vi.resetModules();
    const { recentlyViewedSpells: reloadedSpells } = await importStore();
    expect(reloadedSpells()).toEqual([]);
  });

  // recordSpellView early-return guard
  it("does not write to localStorage again when the spell is already the front-most entry", async () => {
    const { recordSpellView } = await importStore();
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    recordSpellView({ id: "srd-fireball", name: "Fireball", level: 3, school: "Evocation" });
    const callCountAfterFirst = setItemSpy.mock.calls.length;

    // Recording the same spell again (already at front) should be a no-op.
    recordSpellView({ id: "srd-fireball", name: "Fireball", level: 3, school: "Evocation" });
    expect(setItemSpy.mock.calls.length).toBe(callCountAfterFirst);

    vi.restoreAllMocks();
  });

  it("does not change ordering when recording the already-front-most spell", async () => {
    const { recentlyViewedSpells, recordSpellView } = await importStore();
    recordSpellView({ id: "srd-fireball", name: "Fireball", level: 3, school: "Evocation" });
    recordSpellView({ id: "srd-shield", name: "Shield", level: 1, school: "Abjuration" });

    // Shield is now at front; recording Shield again should leave order unchanged.
    recordSpellView({ id: "srd-shield", name: "Shield", level: 1, school: "Abjuration" });

    expect(recentlyViewedSpells()).toHaveLength(2);
    expect(recentlyViewedSpells()[0].id).toBe("srd-shield");
    expect(recentlyViewedSpells()[1].id).toBe("srd-fireball");
  });
});
