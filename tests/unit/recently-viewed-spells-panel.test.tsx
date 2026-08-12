// @vitest-environment jsdom
import { MemoryRouter, Route } from "@solidjs/router";
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecentlyViewedSpellsPanel } from "../../src/client/components/RecentlyViewedSpellsPanel";
import { __resetRecentlyViewedForTests, recordSpellView } from "../../src/client/lib/recentlyViewed";

afterEach(() => {
  // Reset signal before cleanup() so the panel unmounts cleanly while the Solid tree is alive.
  __resetRecentlyViewedForTests();
  cleanup();
  vi.clearAllMocks();
});

const renderPanel = (onSpellClick = vi.fn()) => {
  // Route wrapper is required because SpellSummaryCard renders <A>, which needs a router context.
  render(() => (
    <MemoryRouter>
      <Route path="/" component={() => <RecentlyViewedSpellsPanel onSpellClick={onSpellClick} />} />
    </MemoryRouter>
  ));
  return onSpellClick;
};

describe("RecentlyViewedSpellsPanel", () => {
  it("renders nothing when there is no view history", () => {
    renderPanel();
    expect(screen.queryByText("Recently viewed")).toBeNull();
  });

  it("renders a card for each recorded view", () => {
    recordSpellView({ id: "srd-fireball", name: "Fireball", level: 3, school: "Evocation" });
    recordSpellView({ id: "srd-shield", name: "Shield", level: 1, school: "Abjuration" });

    renderPanel();

    expect(screen.getByText("Fireball")).toBeTruthy();
    expect(screen.getByText("Shield")).toBeTruthy();
    expect(screen.getByText("Recently viewed")).toBeTruthy();
  });

  it("calls onSpellClick with the spell id when a card is clicked", () => {
    recordSpellView({ id: "srd-fireball", name: "Fireball", level: 3, school: "Evocation" });

    const onSpellClick = renderPanel();
    fireEvent.click(screen.getByText("Fireball"));

    expect(onSpellClick).toHaveBeenCalledOnce();
    expect(onSpellClick).toHaveBeenCalledWith(expect.any(MouseEvent), "srd-fireball");
  });
});
