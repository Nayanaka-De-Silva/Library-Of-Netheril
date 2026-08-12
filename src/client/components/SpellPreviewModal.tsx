import { A } from "@solidjs/router";
import { Show, createResource } from "solid-js";
import { Modal } from "./Modal";
import { SpellDetailView } from "./SpellDetailView";
import { api, getErrorMessage } from "../lib/api";
import type { Spell } from "../../shared/schemas";

type SpellPreviewModalProps = {
  // Null while nothing is being previewed, which also keeps the spell request from firing.
  spellId: string | null;
  onClose: () => void;
  onDeleted: () => void;
};

// Shows a spell's full details over the list so the active filters and scroll position survive.
export function SpellPreviewModal(props: SpellPreviewModalProps) {
  // Scoped to this component's lifetime (the modal stays mounted across open/close), so reopening a
  // previously-viewed spell reuses its record instead of refetching it from the network every time.
  const cache = new Map<string, Spell>();

  const [spell] = createResource(
    () => props.spellId ?? undefined,
    async (id) => {
      const cached = cache.get(id);
      if (cached) return cached;

      const record = await api.getSpell(id);
      cache.set(id, record);
      return record;
    },
  );

  return (
    <Modal open={props.spellId !== null} onClose={props.onClose} label={spell()?.name ?? "Spell details"}>
      {/* Only show the loading banner when there's nothing to display yet — switching between two
          previews keeps the previous spell on screen instead of stacking "Loading…" over stale content. */}
      <Show when={spell.loading && !spell()}>
        <div class="state-panel">Loading spell…</div>
      </Show>
      <Show when={spell.error}>
        <div class="error-panel">{getErrorMessage(spell.error)}</div>
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
