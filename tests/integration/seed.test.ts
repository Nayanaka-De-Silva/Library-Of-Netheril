import { describe, expect, it } from "vitest";
import path from "node:path";
import { createTestContext } from "../helpers/test-context";
import { defaultSpellForm } from "../../src/client/lib/form";

describe("official seed import", () => {
  it("is idempotent and preserves custom spells", async () => {
    const context = await createTestContext();

    const initial = context.service.listSpells({
      page: 1,
      pageSize: 100,
      classes: [],
      source: "all",
      sort: "name",
      direction: "asc",
    });

    expect(initial.totalItems).toBe(410);

    const customSpell = context.service.createCustomSpell({
      ...defaultSpellForm(),
      name: "Netheril Burst",
      description: "A custom test spell.",
      range: "90 feet",
      duration: "Instantaneous",
      castingTime: "1 action",
      school: "Evocation",
      classes: ["Wizard"],
    });

    context.service.seedOfficialSpells(path.resolve(process.cwd(), "data/spells.json"));

    const reseeded = context.service.listSpells({
      page: 1,
      pageSize: 100,
      classes: [],
      source: "all",
      sort: "name",
      direction: "asc",
    });

    expect(reseeded.totalItems).toBe(411);
    expect(context.service.getSpellById(customSpell.id).name).toBe("Netheril Burst");
  });
});
