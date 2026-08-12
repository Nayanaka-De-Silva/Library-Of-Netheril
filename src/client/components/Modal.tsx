import { Show, createEffect, onCleanup, type JSX } from "solid-js";
import { Portal } from "solid-js/web";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: JSX.Element;
};

// Generic overlay dialog: closes on backdrop click or Escape, and hands focus back where it came from.
export function Modal(props: ModalProps) {
  let dialog: HTMLDivElement | undefined;

  createEffect(() => {
    if (!props.open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") props.onClose();
    };
    document.addEventListener("keydown", closeOnEscape);

    onCleanup(() => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    });
  });

  return (
    <Show when={props.open}>
      <Portal>
        <div
          class="modal-backdrop"
          // Only a click on the backdrop itself dismisses; clicks inside the panel bubble up harmlessly.
          onClick={(event) => {
            if (event.target === event.currentTarget) props.onClose();
          }}
        >
          <div ref={dialog} class="modal-panel" role="dialog" aria-modal="true" aria-label={props.label} tabindex="-1">
            <button type="button" class="modal-close" aria-label="Close" onClick={() => props.onClose()}>
              ×
            </button>
            {props.children}
          </div>
        </div>
      </Portal>
    </Show>
  );
}
