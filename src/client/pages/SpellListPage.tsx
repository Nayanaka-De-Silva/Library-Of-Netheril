import { useSearchParams } from "@solidjs/router";
import { For, Show, createMemo, createResource } from "solid-js";
import { Layout } from "../components/Layout";
import { RecentlyViewedSpellsPanel } from "../components/RecentlyViewedSpellsPanel";
import { SpellPreviewModal } from "../components/SpellPreviewModal";
import { SpellSummaryCard } from "../components/SpellSummaryCard";
import { api, getErrorMessage } from "../lib/api";
import { shouldOpenInlinePreview } from "../lib/interaction";

// Which spell is previewed lives in the URL, so Back closes the popup instead of leaving the list.
const PREVIEW_PARAM = "preview";

// Every query param the list API accepts. Naming them (rather than iterating every searchParams
// entry) keeps the query memo from tracking PREVIEW_PARAM, so opening or closing the preview never
// triggers a spell list refetch — while still passing through page size/sort/direction for anyone
// who lands on a URL that sets them explicitly.
const LIST_QUERY_PARAM_KEYS = [
  "search",
  "level",
  "school",
  "class",
  "ritual",
  "concentration",
  "source",
  "page",
  "pageSize",
  "sort",
  "direction",
] as const;

export function SpellListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = createMemo(() => {
    const next = new URLSearchParams();
    for (const key of LIST_QUERY_PARAM_KEYS) {
      const value = searchParams[key];

      if (Array.isArray(value)) {
        for (const entry of value) next.append(key, entry);
      } else if (value) {
        next.set(key, value);
      }
    }

    if (!next.has("page")) next.set("page", "1");
    if (!next.has("pageSize")) next.set("pageSize", "25");
    if (!next.has("sort")) next.set("sort", "name");
    if (!next.has("direction")) next.set("direction", "asc");

    return next;
  });

  const [metadata] = createResource(() => api.getMetadata());
  const [spells, { refetch: refetchSpells }] = createResource(params, (current) => api.getSpellList(current));

  const previewedSpellId = createMemo(() => {
    const selection = searchParams[PREVIEW_PARAM];
    const spellId = Array.isArray(selection) ? selection[0] : selection;

    // An empty `?preview=` is presence-without-a-value, not a real id — treat it the same as absent.
    return spellId ? spellId : null;
  });

  const currentPage = createMemo(() => Number(params().get("page") ?? "1"));

  // Any change to the list itself dismisses an open preview, so the popup never floats over a different result set.
  // setSearchParams merges the patch into the current URL itself (see @solidjs/router's mergeSearchString), so
  // there's no need to spread the existing searchParams store back in here.
  const updateListParams = (changes: Record<string, string | undefined>) => {
    setSearchParams({
      [PREVIEW_PARAM]: undefined,
      ...changes,
    });
  };

  const updateFilter = (key: string, value: string) => {
    updateListParams({ page: "1", [key]: value || undefined });
  };

  // Preview in place for a plain click; modifier and middle clicks stay real navigations to the detail route.
  const previewSpell = (event: MouseEvent, spellId: string) => {
    if (!shouldOpenInlinePreview(event)) return;

    event.preventDefault();
    setSearchParams({ [PREVIEW_PARAM]: spellId });
  };

  const closePreview = () => setSearchParams({ [PREVIEW_PARAM]: undefined });

  return (
    <Layout>
      <h1 class="page-heading">Spells</h1>
      <RecentlyViewedSpellsPanel onSpellClick={previewSpell} />

      <section class="card filters">
        <div class="form-grid">
          <label>
            <span>Search</span>
            <input
              value={searchParams.search ?? ""}
              onInput={(event) => updateFilter("search", event.currentTarget.value)}
              placeholder="Fireball"
            />
          </label>
          <label>
            <span>Level</span>
            <select value={searchParams.level ?? ""} onChange={(event) => updateFilter("level", event.currentTarget.value)}>
              <option value="">All</option>
              <For each={metadata()?.levels ?? []}>{(level) => <option value={level}>{level}</option>}</For>
            </select>
          </label>
          <label>
            <span>School</span>
            <select value={searchParams.school ?? ""} onChange={(event) => updateFilter("school", event.currentTarget.value)}>
              <option value="">All</option>
              <For each={metadata()?.schools ?? []}>{(school) => <option value={school}>{school}</option>}</For>
            </select>
          </label>
          <label>
            <span>Class</span>
            <select value={searchParams.class ?? ""} onChange={(event) => updateFilter("class", event.currentTarget.value)}>
              <option value="">All</option>
              <For each={metadata()?.classes ?? []}>{(className) => <option value={className}>{className}</option>}</For>
            </select>
          </label>
          <label>
            <span>Source</span>
            <select value={searchParams.source ?? "all"} onChange={(event) => updateFilter("source", event.currentTarget.value)}>
              <option value="all">All</option>
              <option value="official">Official</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label>
            <span>Ritual</span>
            <select value={searchParams.ritual ?? ""} onChange={(event) => updateFilter("ritual", event.currentTarget.value)}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <label>
            <span>Concentration</span>
            <select
              value={searchParams.concentration ?? ""}
              onChange={(event) => updateFilter("concentration", event.currentTarget.value)}
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
        </div>
      </section>

      <Show when={spells.loading}>
        <div class="state-panel">Loading spells…</div>
      </Show>
      <Show when={spells.error}>
        <div class="error-panel">{getErrorMessage(spells.error)}</div>
      </Show>

      <Show when={spells()?.data.length}>
        <div class="list-grid">
          <For each={spells()?.data}>
            {(spell) => (
              <SpellSummaryCard spell={spell} onClick={(event) => previewSpell(event, spell.id)} />
            )}
          </For>
        </div>
      </Show>

      <Show when={spells() && spells()?.data.length === 0}>
        <div class="state-panel">No spells matched the current filters.</div>
      </Show>

      <Show when={spells()}>
        {(result) => (
          <div class="pagination card">
            <div>
              Page {result().meta.page} of {result().meta.totalPages || 0} · {result().meta.totalItems} total spells
            </div>
            <div class="pagination-controls">
              <button
                disabled={currentPage() <= 1}
                onClick={() => updateListParams({ page: String(currentPage() - 1) })}
              >
                Previous
              </button>
              <button
                disabled={currentPage() >= result().meta.totalPages}
                onClick={() => updateListParams({ page: String(currentPage() + 1) })}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Show>

      <SpellPreviewModal
        spellId={previewedSpellId()}
        onClose={closePreview}
        onDeleted={() => {
          closePreview();
          void refetchSpells();
        }}
      />
    </Layout>
  );
}
