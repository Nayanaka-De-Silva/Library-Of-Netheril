import { Show } from "solid-js";
import type { Spell } from "../../shared/schemas";

// Renders the at-a-glance stat tiles (level, school, range, ...) shown above a spell's description.
export function SpellStatGrid(props: { spell: Spell }) {
  const componentCodes = () =>
    [props.spell.components.verbal && "V", props.spell.components.somatic && "S", props.spell.components.material && "M"]
      .filter(Boolean)
      .join(", ");

  return (
    <dl class="detail-grid">
      <div>
        <dt>Level</dt>
        <dd>{props.spell.level}</dd>
      </div>
      <div>
        <dt>School</dt>
        <dd>{props.spell.school}</dd>
      </div>
      <div>
        <dt>Range</dt>
        <dd>{props.spell.range}</dd>
      </div>
      <div>
        <dt>Duration</dt>
        <dd>{props.spell.duration}</dd>
      </div>
      <div>
        <dt>Casting time</dt>
        <dd>{props.spell.castingTime}</dd>
      </div>
      <div>
        <dt>Ritual</dt>
        <dd>{props.spell.ritual ? "Yes" : "No"}</dd>
      </div>
      <div>
        <dt>Concentration</dt>
        <dd>{props.spell.concentration ? "Yes" : "No"}</dd>
      </div>
      <div>
        <dt>Classes</dt>
        <dd>{props.spell.classes.join(", ") || "None"}</dd>
      </div>
      <div>
        <dt>Components</dt>
        <dd>
          {componentCodes()}
          <Show when={props.spell.components.materialDescription}>
            <span> — {props.spell.components.materialDescription}</span>
          </Show>
        </dd>
      </div>
      <div>
        <dt>Page</dt>
        <dd>{props.spell.page ?? "—"}</dd>
      </div>
    </dl>
  );
}
