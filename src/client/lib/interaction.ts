// Modifier/button state of a pointer click, narrowed so this stays usable outside the DOM.
export type PointerIntent = Pick<MouseEvent, "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey">;

// A plain primary click should preview in place; anything the browser treats as "open elsewhere" is left alone.
export function shouldOpenInlinePreview(intent: PointerIntent): boolean {
  if (intent.button !== 0) return false;

  return !intent.metaKey && !intent.ctrlKey && !intent.shiftKey && !intent.altKey;
}
