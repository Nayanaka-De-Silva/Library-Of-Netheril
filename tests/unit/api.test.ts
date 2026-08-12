import { describe, expect, it } from "vitest";
import { ApiClientError, getErrorMessage } from "../../src/client/lib/api";

describe("getErrorMessage", () => {
  it("returns the message carried by an ApiClientError", () => {
    const error = new ApiClientError(404, "NOT_FOUND", "Spell not found.");

    expect(getErrorMessage(error)).toBe("Spell not found.");
  });

  it("returns the message from any other Error", () => {
    expect(getErrorMessage(new TypeError("Failed to fetch"))).toBe("Failed to fetch");
  });

  it("falls back to a generic message for non-Error values", () => {
    expect(getErrorMessage("some string")).toBe("Something went wrong. Please try again.");
    expect(getErrorMessage(undefined)).toBe("Something went wrong. Please try again.");
    expect(getErrorMessage(null)).toBe("Something went wrong. Please try again.");
  });
});
