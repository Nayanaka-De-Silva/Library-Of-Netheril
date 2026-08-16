import { For, Show } from "solid-js";
import { SpellSummaryCard } from "./SpellSummaryCard";
import { recentlyViewedSpells } from "../lib/recentlyViewed";

type RecentlyViewedSpellsPanelProps = {
  // Mirrors the previewSpell signature from SpellListPage so it can be passed directly.
  onSpellClick: (event: MouseEvent, spellId: string) => void;
};

// Dashboard panel that reactively shows the spells the user has recently viewed.
// Renders nothing on a fresh visit — fades in the moment a spell is viewed.
export function RecentlyViewedSpellsPanel(props: RecentlyViewedSpellsPanelProps) {
  return (
    <Show when={recentlyViewedSpells().length > 0}>
      <section class="card recently-viewed">
        <h2>Recently viewed</h2>
        <div class="recently-viewed-grid">
          <For each={recentlyViewedSpells()}>
            {(spell) => (
              <SpellSummaryCard
                spell={spell}
                onClick={(event) => props.onSpellClick(event, spell.id)}
              />
            )}
          </For>
        </div>
      </section>
    </Show>
  );
}
