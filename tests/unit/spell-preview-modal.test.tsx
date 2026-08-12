// @vitest-environment jsdom
import { MemoryRouter, Route, createMemoryHistory } from "@solidjs/router";
import { cleanup, fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Modal } from "../../src/client/components/Modal";
import { SpellListPage } from "../../src/client/pages/SpellListPage";
import type { Spell } from "../../src/shared/schemas";

const fireball: Spell = {
  id: "srd-fireball",
  name: "Fireball",
  description: "A bright streak flashes from your pointing finger.",
  atHigherLevel: null,
  page: "phb 241",
  range: "150 feet",
  components: { raw: "V, S, M", verbal: true, somatic: true, material: "a tiny ball of bat guano" },
  ritual: false,
  duration: "Instantaneous",
  concentration: false,
  castingTime: "1 action",
  level: 3,
  school: "evocation",
  classes: ["sorcerer", "wizard"],
  source: "official",
  slug: "fireball",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const getSpellList = vi.fn();
const getSpell = vi.fn();

vi.mock("../../src/client/lib/api", () => ({
  ApiClientError: class ApiClientError extends Error {},
  api: {
    getSpellList: (params: URLSearchParams) => getSpellList(params),
    getSpell: (id: string) => getSpell(id),
    getMetadata: () => Promise.resolve({ schools: [], classes: [], levels: [], sources: [], listSources: [] }),
    deleteSpell: () => Promise.resolve(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Modal", () => {
  it("renders nothing while closed", () => {
    render(() => (
      <Modal open={false} onClose={() => {}} label="Spell details">
        <p>Fireball</p>
      </Modal>
    ));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes when the backdrop itself is clicked", () => {
    const onClose = vi.fn();
    const { baseElement } = render(() => (
      <Modal open onClose={onClose} label="Spell details">
        <p>Fireball</p>
      </Modal>
    ));

    fireEvent.click(baseElement.querySelector(".modal-backdrop")!);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("stays open when the click lands inside the panel", () => {
    const onClose = vi.fn();
    render(() => (
      <Modal open onClose={onClose} label="Spell details">
        <p>Fireball</p>
      </Modal>
    ));

    fireEvent.click(screen.getByText("Fireball"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(() => (
      <Modal open onClose={onClose} label="Spell details">
        <p>Fireball</p>
      </Modal>
    ));

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("spell preview on the list page", () => {
  const renderFilteredList = () => {
    const history = createMemoryHistory();
    history.set({ value: "/spells?school=evocation" });

    render(() => (
      <MemoryRouter history={history}>
        <Route path="/spells" component={SpellListPage} />
        <Route path="/spells/:id" component={() => <p>full detail page</p>} />
      </MemoryRouter>
    ));

    return history;
  };

  beforeEach(() => {
    getSpellList.mockResolvedValue({
      data: [{ id: fireball.id, name: fireball.name, level: fireball.level, school: fireball.school }],
      meta: { page: 1, pageSize: 25, totalItems: 1, totalPages: 1 },
    });
    getSpell.mockResolvedValue(fireball);
  });

  it("opens the spell over the list instead of navigating to the detail page", async () => {
    const history = renderFilteredList();

    fireEvent.click(await screen.findByText("Fireball"));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.queryByText("full detail page")).toBeNull();
    // The filter survives alongside the preview selection, which is what the full page navigation used to lose.
    expect(history.get()).toContain("school=evocation");
    expect(history.get()).toContain(`preview=${fireball.id}`);
  });

  it("does not refetch the list when a preview opens", async () => {
    renderFilteredList();
    await screen.findByText("Fireball");
    const requestsBeforePreview = getSpellList.mock.calls.length;

    fireEvent.click(screen.getByText("Fireball"));
    await screen.findByRole("dialog");

    expect(getSpellList.mock.calls.length).toBe(requestsBeforePreview);
  });

  it("closes the preview and keeps the filtered list when the backdrop is clicked", async () => {
    const history = renderFilteredList();
    fireEvent.click(await screen.findByText("Fireball"));
    await screen.findByRole("dialog");

    fireEvent.click(document.querySelector(".modal-backdrop")!);

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByText("Fireball")).toBeTruthy();
    expect(history.get()).toContain("school=evocation");
    expect(history.get()).not.toContain("preview=");
  });

  it("closes the preview on Back rather than leaving the filtered list", async () => {
    const history = renderFilteredList();
    fireEvent.click(await screen.findByText("Fireball"));
    await screen.findByRole("dialog");

    history.back();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByText("Fireball")).toBeTruthy();
    expect(history.get()).toContain("school=evocation");
  });

  it("reopens the preview when the list is loaded with a preview in the URL", async () => {
    const history = createMemoryHistory();
    history.set({ value: `/spells?school=evocation&preview=${fireball.id}` });

    render(() => (
      <MemoryRouter history={history}>
        <Route path="/spells" component={SpellListPage} />
      </MemoryRouter>
    ));

    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("leaves modifier clicks to the browser so a new tab still works", async () => {
    renderFilteredList();

    fireEvent.click(await screen.findByText("Fireball"), { ctrlKey: true });

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
