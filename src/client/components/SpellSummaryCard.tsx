import { A } from "@solidjs/router";
import { formatSpellLevelAndSchool } from "../lib/spellFormatting";
import type { SpellSummary } from "../../shared/schemas";

type SpellSummaryCardProps = {
  spell: SpellSummary;
  onClick: (event: MouseEvent) => void;
};

// Reusable card for a spell summary — used in both the main list grid and the recently-viewed panel.
export function SpellSummaryCard(props: SpellSummaryCardProps) {
  return (
    <A
      href={`/spells/${props.spell.id}`}
      class="card spell-list-item"
      onClick={props.onClick}
    >
      <div class="spell-list-copy">
        <h2>{props.spell.name}</h2>
        <p class="muted">{formatSpellLevelAndSchool(props.spell.level, props.spell.school)}</p>
      </div>
    </A>
  );
}
