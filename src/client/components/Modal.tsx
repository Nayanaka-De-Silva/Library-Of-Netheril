import { Show, createEffect, onCleanup, type JSX } from "solid-js";
import { Portal } from "solid-js/web";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: JSX.Element;
};

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Generic overlay dialog: closes on backdrop click or Escape, traps Tab inside the panel while open,
// and hands focus back where it came from.
export function Modal(props: ModalProps) {
  let dialog: HTMLDivElement | undefined;

  createEffect(() => {
    if (!props.open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.focus();

    const getFocusable = (): HTMLElement[] =>
      dialog ? Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        props.onClose();
        return;
      }

      if (event.key !== "Tab") return;

      // Keep keyboard focus inside the dialog so Tab can't reach the page still visible behind the backdrop.
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        dialog?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeydown);

    onCleanup(() => {
      document.removeEventListener("keydown", handleKeydown);
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
