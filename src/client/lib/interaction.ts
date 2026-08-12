// Modifier/button state of a pointer click, narrowed so this stays usable outside the DOM.
export type PointerIntent = Pick<MouseEvent, "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey">;

// A plain primary click should preview in place; anything the browser treats as "open elsewhere" is left alone.
//
// This deliberately mirrors the button/modifier check @solidjs/router's own <A> component runs internally
// (node_modules/@solidjs/router/dist/data/events.js) before deciding whether to intercept a click as an
// in-app navigation. That check isn't exported, so there's no way to delegate to it directly — if the
// router's own gating ever changes (e.g. a new bypass condition), revisit this alongside it.
export function shouldOpenInlinePreview(intent: PointerIntent): boolean {
  if (intent.button !== 0) return false;

  return !intent.metaKey && !intent.ctrlKey && !intent.shiftKey && !intent.altKey;
}
