import { describe, expect, it } from "vitest";
import { normalizeRawSpell } from "../../src/shared/normalization";
import { parseSpellListQuery } from "../../src/server/lib/validation";
import { ApiError } from "../../src/server/lib/errors";

describe("spell normalization", () => {
  it("normalizes raw spell records into canonical official spells", () => {
    const spell = normalizeRawSpell({
      name: "Absorb Elements",
      desc: "<p>Incoming energy is softened.</p><p>It powers your next hit.</p>",
      higher_level: "<p>Extra damage increases.</p>",
      page: "ee pc 15",
      range: "Self",
      components: "S, M",
      material: "A shard of crystal.",
      ritual: "no",
      duration: "1 round",
      concentration: "no",
      casting_time: "1 reaction",
      level: "1st-level",
      school: "Abjuration",
      classes: "Druid, Ranger, Ritual Caster, Wizard",
    });

    expect(spell).toMatchObject({
      id: "ee-pc-absorb-elements",
      slug: "absorb-elements",
      source: "official",
      page: "EE PC 15",
      level: 1,
      ritual: false,
      concentration: false,
      description: "Incoming energy is softened.\n\nIt powers your next hit.",
      atHigherLevel: "Extra damage increases.",
      classes: ["Druid", "Ranger", "Wizard"],
      components: {
        verbal: false,
        somatic: true,
        material: true,
        materialDescription: "A shard of crystal.",
      },
    });
  });
});

describe("query validation", () => {
  it("ignores unknown query parameters and parses valid filters", () => {
    const query = parseSpellListQuery(
      new URL("http://localhost/api/v1/spells?page=2&pageSize=10&class=Wizard&unknown=value&source=official"),
    );

    expect(query.page).toBe(2);
    expect(query.pageSize).toBe(10);
    expect(query.classes).toEqual(["Wizard"]);
    expect(query.source).toBe("official");
  });

  it("returns a validation error for invalid filter values", () => {
    expect(() => parseSpellListQuery(new URL("http://localhost/api/v1/spells?pageSize=101"))).toThrowError(ApiError);
    expect(() => parseSpellListQuery(new URL("http://localhost/api/v1/spells?ritual=maybe"))).toThrowError(ApiError);
  });
});
