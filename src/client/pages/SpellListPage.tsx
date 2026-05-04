import { A, useSearchParams } from "@solidjs/router";
import { For, Show, createMemo, createResource } from "solid-js";
import { Layout } from "../components/Layout";
import { SpellBadge } from "../components/SpellBadge";
import { api, ApiClientError } from "../lib/api";

export function SpellListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = createMemo(() => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
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
  const [spells] = createResource(params, (current) => api.getSpellList(current));

  const currentPage = createMemo(() => Number(params().get("page") ?? "1"));

  const updateFilter = (key: string, value: string) => {
    setSearchParams({
      ...searchParams,
      page: "1",
      [key]: value || undefined,
    });
  };

  return (
    <Layout>
      <section class="hero card">
        <div>
          <p class="eyebrow">Public REST API + responsive web client</p>
          <h1>Browse spells without bypassing the API.</h1>
          <p>Official spells are seeded from canonical data. Custom spells are created through the same REST surface.</p>
        </div>
        <A href="/spells/new" class="primary-button">
          Create Custom Spell
        </A>
      </section>

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
        <div class="error-panel">{(spells.error as ApiClientError).message}</div>
      </Show>

      <Show when={spells()?.data.length}>
        <div class="list-grid">
          <For each={spells()?.data}>
            {(spell) => (
              <A href={`/spells/${spell.id}`} class="card spell-list-item">
                <div>
                  <h2>{spell.name}</h2>
                  <p class="muted">{spell.id}</p>
                </div>
                <SpellBadge source={spell.id.startsWith("custom-") ? "custom" : "official"} />
              </A>
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
                onClick={() => setSearchParams({ ...searchParams, page: String(currentPage() - 1) })}
              >
                Previous
              </button>
              <button
                disabled={currentPage() >= result().meta.totalPages}
                onClick={() => setSearchParams({ ...searchParams, page: String(currentPage() + 1) })}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Show>
    </Layout>
  );
}
