import { A, useNavigate, useParams } from "@solidjs/router";
import { Show, createResource } from "solid-js";
import { Layout } from "../components/Layout";
import { SpellBadge } from "../components/SpellBadge";
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
            <dl class="detail-grid">
              <div>
                <dt>Level</dt>
                <dd>{record().level}</dd>
              </div>
              <div>
                <dt>School</dt>
                <dd>{record().school}</dd>
              </div>
              <div>
                <dt>Range</dt>
                <dd>{record().range}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{record().duration}</dd>
              </div>
              <div>
                <dt>Casting time</dt>
                <dd>{record().castingTime}</dd>
              </div>
              <div>
                <dt>Ritual</dt>
                <dd>{record().ritual ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt>Concentration</dt>
                <dd>{record().concentration ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt>Classes</dt>
                <dd>{record().classes.join(", ") || "None"}</dd>
              </div>
              <div>
                <dt>Components</dt>
                <dd>
                  {[record().components.verbal && "V", record().components.somatic && "S", record().components.material && "M"]
                    .filter(Boolean)
                    .join(", ")}
                  <Show when={record().components.materialDescription}>
                    <span> — {record().components.materialDescription}</span>
                  </Show>
                </dd>
              </div>
              <div>
                <dt>Page</dt>
                <dd>{record().page ?? "—"}</dd>
              </div>
            </dl>

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
