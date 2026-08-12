import { A } from "@solidjs/router";
import { Show, createResource } from "solid-js";
import { Modal } from "./Modal";
import { SpellDetailView } from "./SpellDetailView";
import { api, ApiClientError } from "../lib/api";

type SpellPreviewModalProps = {
  // Null while nothing is being previewed, which also keeps the spell request from firing.
  spellId: string | null;
  onClose: () => void;
  onDeleted: () => void;
};

// Shows a spell's full details over the list so the active filters and scroll position survive.
export function SpellPreviewModal(props: SpellPreviewModalProps) {
  const [spell] = createResource(
    () => props.spellId ?? undefined,
    (id) => api.getSpell(id),
  );

  return (
    <Modal open={props.spellId !== null} onClose={props.onClose} label={spell()?.name ?? "Spell details"}>
      <Show when={spell.loading}>
        <div class="state-panel">Loading spell…</div>
      </Show>
      <Show when={spell.error}>
        <div class="error-panel">{(spell.error as ApiClientError).message}</div>
      </Show>
      <Show when={spell()}>
        {(record) => (
          <SpellDetailView
            spell={record()}
            onDeleted={props.onDeleted}
            navigationAction={<A href={`/spells/${record().id}`}>Open full page</A>}
          />
        )}
      </Show>
    </Modal>
  );
}
