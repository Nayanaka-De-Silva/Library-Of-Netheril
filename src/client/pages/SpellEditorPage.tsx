import { useNavigate, useParams } from "@solidjs/router";
import { Match, Show, Switch, createMemo, createResource, createSignal } from "solid-js";
import { Layout } from "../components/Layout";
import { SpellForm } from "../components/SpellForm";
import { api, ApiClientError } from "../lib/api";
import { defaultSpellForm } from "../lib/form";

export function SpellEditorPage() {
  const params = useParams();
  const navigate = useNavigate();
  const isEdit = createMemo(() => Boolean(params.id));
  const [submitError, setSubmitError] = createSignal<ApiClientError | null>(null);
  const [metadata] = createResource(() => api.getMetadata());
  const [spell] = createResource(() => params.id, (id) => (id ? api.getSpell(id) : null));

  const initialValue = createMemo(() =>
    spell()
      ? {
          name: spell()!.name,
          description: spell()!.description,
          atHigherLevel: spell()!.atHigherLevel,
          page: spell()!.page,
          range: spell()!.range,
          components: spell()!.components,
          ritual: spell()!.ritual,
          duration: spell()!.duration,
          concentration: spell()!.concentration,
          castingTime: spell()!.castingTime,
          level: spell()!.level,
          school: spell()!.school,
          classes: spell()!.classes,
        }
      : defaultSpellForm(),
  );

  return (
    <Layout>
      <Switch>
        <Match when={metadata.loading || (isEdit() && spell.loading)}>
          <div class="state-panel">Loading editor…</div>
        </Match>
        <Match when={metadata.error || spell.error}>
          <div class="error-panel">{(metadata.error ?? spell.error as ApiClientError)?.message}</div>
        </Match>
        <Match when={isEdit() && spell() && spell()!.source === "official"}>
          <div class="error-panel">Official spells are read-only and cannot be edited.</div>
        </Match>
        <Match when={metadata()}>
          <div class="editor-stack">
            <div class="card">
              <p class="eyebrow">{isEdit() ? "Update custom spell" : "Create custom spell"}</p>
              <h1>{isEdit() ? `Edit ${spell()?.name}` : "New custom spell"}</h1>
            </div>
            <SpellForm
              value={initialValue()}
              schools={metadata()!.schools}
              classes={metadata()!.classes}
              submitLabel={isEdit() ? "Save Spell" : "Create Spell"}
              error={submitError()}
              onSubmit={async (value) => {
                try {
                  setSubmitError(null);
                  const saved = isEdit() ? await api.replaceSpell(params.id!, value) : await api.createSpell(value);
                  navigate(`/spells/${saved.id}`);
                } catch (error) {
                  setSubmitError(error as ApiClientError);
                }
              }}
            />
          </div>
        </Match>
      </Switch>
    </Layout>
  );
}
