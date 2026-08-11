import { A, useNavigate, useParams } from "@solidjs/router";
import { Show, createResource } from "solid-js";
import { Layout } from "../components/Layout";
import { SpellBadge } from "../components/SpellBadge";
import { SpellStatGrid } from "../components/SpellStatGrid";
import { api, ApiClientError } from "../lib/api";

export function SpellDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [spell] = createResource(() => params.id, (id) => api.getSpell(id));

  return (
    <Layout>
      <Show when={spell.loading}>
        <div class="state-panel">Loading spell…</div>
      </Show>
      <Show when={spell.error}>
        <div class="error-panel">{(spell.error as ApiClientError).message}</div>
      </Show>
      <Show when={spell()}>
        {(record) => (
          <article class="card detail-card">
            <div class="detail-header">
              <div>
                <p class="eyebrow">{record().id}</p>
                <h1>{record().name}</h1>
              </div>
              <SpellBadge source={record().source} />
            </div>
            <SpellStatGrid spell={record()} />

            <p class="detail-copy">{record().description}</p>
            <Show when={record().atHigherLevel}>
              <section>
                <h2>At Higher Level</h2>
                <p class="detail-copy">{record().atHigherLevel}</p>
              </section>
            </Show>

            <div class="action-row">
              <A href="/spells">Back to list</A>
              <Show when={record().source === "custom"}>
                <div class="action-row">
                  <A href={`/spells/${record().id}/edit`} class="button-link">
                    Edit
                  </A>
                  <button
                    class="danger-button"
                    onClick={async () => {
                      if (!window.confirm("Delete this custom spell?")) return;
                      await api.deleteSpell(record().id);
                      navigate("/spells");
                    }}
                  >
                    Delete
                  </button>
                </div>
              </Show>
            </div>
          </article>
        )}
      </Show>
    </Layout>
  );
}
