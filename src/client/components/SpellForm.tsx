import { For, Show, createEffect, createSignal } from "solid-js";
import type { CreateSpellInput } from "../../shared/schemas";
import type { ApiClientError } from "../lib/api";

type SpellFormProps = {
  value: CreateSpellInput;
  schools: string[];
  classes: string[];
  submitLabel: string;
  onSubmit: (value: CreateSpellInput) => Promise<void>;
  error?: ApiClientError | null;
};

export function SpellForm(props: SpellFormProps) {
  const [value, setValue] = createSignal<CreateSpellInput>(props.value);

  createEffect(() => {
    setValue(props.value);
  });

  const update = <K extends keyof CreateSpellInput>(key: K, next: CreateSpellInput[K]) => {
    setValue((current) => ({ ...current, [key]: next }));
  };

  const toggleClass = (className: string) => {
    const nextClasses = value().classes.includes(className as never)
      ? value().classes.filter((entry) => entry !== className)
      : [...value().classes, className as never];
    update("classes", nextClasses);
  };

  return (
    <form
      class="spell-form card"
      onSubmit={async (event) => {
        event.preventDefault();
        await props.onSubmit({
          ...value(),
          atHigherLevel: value().atHigherLevel?.trim() ? value().atHigherLevel : null,
          page: value().page?.trim() ? value().page : null,
          components: {
            ...value().components,
            materialDescription:
              value().components.material && value().components.materialDescription?.trim()
                ? value().components.materialDescription
                : null,
          },
        });
      }}
    >
      <div class="form-grid">
        <label>
          <span>Name</span>
          <input value={value().name} onInput={(event) => update("name", event.currentTarget.value)} required />
        </label>
        <label>
          <span>Level</span>
          <input
            type="number"
            min="0"
            max="9"
            value={value().level}
            onInput={(event) => update("level", Number(event.currentTarget.value))}
            required
          />
        </label>
        <label>
          <span>School</span>
          <select value={value().school} onChange={(event) => update("school", event.currentTarget.value as never)}>
            <For each={props.schools}>{(school) => <option value={school}>{school}</option>}</For>
          </select>
        </label>
        <label>
          <span>Range</span>
          <input value={value().range} onInput={(event) => update("range", event.currentTarget.value)} required />
        </label>
        <label>
          <span>Casting time</span>
          <input
            value={value().castingTime}
            onInput={(event) => update("castingTime", event.currentTarget.value)}
            required
          />
        </label>
        <label>
          <span>Duration</span>
          <input
            value={value().duration}
            onInput={(event) => update("duration", event.currentTarget.value)}
            required
          />
        </label>
        <label>
          <span>Page reference</span>
          <input value={value().page ?? ""} onInput={(event) => update("page", event.currentTarget.value)} />
        </label>
      </div>

      <label>
        <span>Description</span>
        <textarea value={value().description} onInput={(event) => update("description", event.currentTarget.value)} />
      </label>

      <label>
        <span>At Higher Level</span>
        <textarea
          value={value().atHigherLevel ?? ""}
          onInput={(event) => update("atHigherLevel", event.currentTarget.value)}
        />
      </label>

      <section class="fieldset">
        <h3>Components</h3>
        <div class="checkbox-grid">
          <label>
            <input
              type="checkbox"
              checked={value().components.verbal}
              onChange={(event) =>
                setValue((current) => ({
                  ...current,
                  components: { ...current.components, verbal: event.currentTarget.checked },
                }))
              }
            />
            <span>Verbal</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={value().components.somatic}
              onChange={(event) =>
                setValue((current) => ({
                  ...current,
                  components: { ...current.components, somatic: event.currentTarget.checked },
                }))
              }
            />
            <span>Somatic</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={value().components.material}
              onChange={(event) =>
                setValue((current) => ({
                  ...current,
                  components: { ...current.components, material: event.currentTarget.checked },
                }))
              }
            />
            <span>Material</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={value().ritual}
              onChange={(event) => update("ritual", event.currentTarget.checked)}
            />
            <span>Ritual</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={value().concentration}
              onChange={(event) => update("concentration", event.currentTarget.checked)}
            />
            <span>Concentration</span>
          </label>
        </div>
        <label>
          <span>Material description</span>
          <input
            value={value().components.materialDescription ?? ""}
            onInput={(event) =>
              setValue((current) => ({
                ...current,
                components: { ...current.components, materialDescription: event.currentTarget.value },
              }))
            }
            disabled={!value().components.material}
          />
        </label>
      </section>

      <section class="fieldset">
        <h3>Classes</h3>
        <div class="pill-grid">
          <For each={props.classes}>
            {(className) => (
              <button
                type="button"
                class={`pill ${value().classes.includes(className as never) ? "pill-active" : ""}`}
                onClick={() => toggleClass(className)}
              >
                {className}
              </button>
            )}
          </For>
        </div>
      </section>

      <Show when={props.error}>
        <div class="error-panel">
          <strong>{props.error?.message}</strong>
          <Show when={props.error?.details?.length}>
            <ul>
              <For each={props.error?.details}>{(detail) => <li>{detail.field}: {detail.message}</li>}</For>
            </ul>
          </Show>
        </div>
      </Show>

      <button type="submit" class="primary-button">
        {props.submitLabel}
      </button>
    </form>
  );
}
