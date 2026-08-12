import { A } from "@solidjs/router";
import { Show, createSignal, type JSX } from "solid-js";
import { SpellBadge } from "./SpellBadge";
import { SpellStatGrid } from "./SpellStatGrid";
import { api, getErrorMessage } from "../lib/api";
import type { Spell } from "../../shared/schemas";

type SpellDetailViewProps = {
  spell: Spell;
  // Called after a custom spell is deleted so the host surface can navigate or refresh.
  onDeleted: () => void;
  // Surface-specific navigation (a "Back to list" link on the page, a "Close" button in the modal).
  navigationAction?: JSX.Element;
};

// Shared spell presentation used by both the detail route and the in-list preview modal.
export function SpellDetailView(props: SpellDetailViewProps) {
  const [deleteError, setDeleteError] = createSignal<string | null>(null);

  const deleteSpell = async () => {
    if (!window.confirm("Delete this custom spell?")) return;

    setDeleteError(null);
    try {
      await api.deleteSpell(props.spell.id);
      props.onDeleted();
    } catch (error) {
      // Surface the failure instead of leaving the caller staring at a dialog that silently did nothing.
      setDeleteError(getErrorMessage(error));
    }
  };

  return (
    <>
      <div class="detail-header">
        <div>
          <p class="eyebrow">{props.spell.id}</p>
          <h1>{props.spell.name}</h1>
        </div>
        <SpellBadge source={props.spell.source} />
      </div>
      <SpellStatGrid spell={props.spell} />

      <p class="detail-copy">{props.spell.description}</p>
      <Show when={props.spell.atHigherLevel}>
        <section>
          <h2>At Higher Level</h2>
          <p class="detail-copy">{props.spell.atHigherLevel}</p>
        </section>
      </Show>

      <Show when={deleteError()}>
        <div class="error-panel">{deleteError()}</div>
      </Show>

      <div class="action-row">
        {props.navigationAction}
        <Show when={props.spell.source === "custom"}>
          <div class="action-buttons">
            <A href={`/spells/${props.spell.id}/edit`} class="button-link">
              Edit
            </A>
            <button class="danger-button" onClick={deleteSpell}>
              Delete
            </button>
          </div>
        </Show>
      </div>
    </>
  );
}
