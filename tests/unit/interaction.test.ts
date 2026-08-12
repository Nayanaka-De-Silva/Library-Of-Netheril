import { describe, expect, it } from "vitest";
import { shouldOpenInlinePreview } from "../../src/client/lib/interaction";

const click = (overrides: Partial<Parameters<typeof shouldOpenInlinePreview>[0]> = {}) => ({
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...overrides,
});

describe("shouldOpenInlinePreview", () => {
  it("opens the preview for a plain primary click", () => {
    expect(shouldOpenInlinePreview(click())).toBe(true);
  });

  it("defers to the browser for middle clicks so new tabs still work", () => {
    expect(shouldOpenInlinePreview(click({ button: 1 }))).toBe(false);
  });

  it("defers to the browser for modifier clicks", () => {
    expect(shouldOpenInlinePreview(click({ metaKey: true }))).toBe(false);
    expect(shouldOpenInlinePreview(click({ ctrlKey: true }))).toBe(false);
    expect(shouldOpenInlinePreview(click({ shiftKey: true }))).toBe(false);
    expect(shouldOpenInlinePreview(click({ altKey: true }))).toBe(false);
  });
});
