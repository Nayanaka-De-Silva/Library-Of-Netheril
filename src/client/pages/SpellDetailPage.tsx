import { A, useNavigate, useParams } from "@solidjs/router";
import { Show, createResource } from "solid-js";
import { Layout } from "../components/Layout";
import { SpellDetailView } from "../components/SpellDetailView";
import { api, getErrorMessage } from "../lib/api";

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
        <div class="error-panel">{getErrorMessage(spell.error)}</div>
      </Show>
      <Show when={spell()}>
        {(record) => (
          <article class="card detail-card">
            <SpellDetailView
              spell={record()}
              onDeleted={() => navigate("/spells")}
              navigationAction={<A href="/spells">Back to list</A>}
            />
          </article>
        )}
      </Show>
    </Layout>
  );
}
