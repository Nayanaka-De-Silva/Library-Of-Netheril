import { describe, expect, it } from "vitest";
import { createTestContext } from "../helpers/test-context";

const postJson = (url: string, body: unknown, method = "POST") =>
  new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("REST API", () => {
  it("serves health, metadata, and paginated spell summaries", async () => {
    const { app } = await createTestContext();

    const health = await app.request("/api/v1/health");
    expect(health.status).toBe(200);

    const metadata = await app.request("/api/v1/metadata");
    const metadataPayload = await metadata.json();
    expect(metadataPayload.schools).toContain("Evocation");
    expect(metadataPayload.classes).toContain("Artificer");

    const list = await app.request("/api/v1/spells?page=1&pageSize=5&search=fire&source=official");
    expect(list.status).toBe(200);

    const listPayload = await list.json();
    expect(listPayload.meta).toMatchObject({
      page: 1,
      pageSize: 5,
    });
    expect(listPayload.data.length).toBeGreaterThan(0);
    expect(Object.keys(listPayload.data[0]).sort()).toEqual(["id", "level", "name", "school"]);
  });

  it("supports stable lookup, filtering, and validation error shape", async () => {
    const { app } = await createTestContext();

    const filtered = await app.request("/api/v1/spells?school=Evocation&class=Wizard&source=official&pageSize=10");
    const filteredPayload = await filtered.json();
    expect(filteredPayload.meta.totalItems).toBeGreaterThan(0);

    const firstId = filteredPayload.data[0].id;
    const detail = await app.request(`/api/v1/spells/${firstId}`);
    expect(detail.status).toBe(200);

    const spell = await detail.json();
    expect(spell.id).toBe(firstId);
    expect(spell.source).toBe("official");

    const invalid = await app.request("/api/v1/spells?pageSize=101");
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request query failed validation.",
        details: [
          {
            field: "pageSize",
            message: "Number must be less than or equal to 100",
          },
        ],
      },
    });
  });

  it("supports custom spell CRUD and blocks official mutation", async () => {
    const { app } = await createTestContext();

    const createResponse = await app.request(
      postJson("http://localhost/api/v1/spells", {
        name: "Nether Tempest",
        description: "Crackling arcane wind.",
        atHigherLevel: null,
        page: null,
        range: "120 feet",
        components: {
          verbal: true,
          somatic: true,
          material: false,
          materialDescription: null,
        },
        ritual: false,
        duration: "Instantaneous",
        concentration: false,
        castingTime: "1 action",
        level: 3,
        school: "Evocation",
        classes: ["Wizard", "Sorcerer"],
      }),
    );

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created.id).toMatch(/^custom-/);

    const updateResponse = await app.request(
      postJson(`http://localhost/api/v1/spells/${created.id}`, { name: "Nether Tempest Revised" }, "PATCH"),
    );
    expect(updateResponse.status).toBe(200);
    expect((await updateResponse.json()).name).toBe("Nether Tempest Revised");

    const officialList = await app.request("/api/v1/spells?page=1&pageSize=1&source=official");
    const officialId = (await officialList.json()).data[0].id;

    const readonlyResponse = await app.request(
      postJson(`http://localhost/api/v1/spells/${officialId}`, { name: "Tampered" }, "PATCH"),
    );
    expect(readonlyResponse.status).toBe(409);
    expect(await readonlyResponse.json()).toEqual({
      error: {
        code: "OFFICIAL_SPELL_READ_ONLY",
        message: `Official spell '${officialId}' is read-only.`,
      },
    });

    const deleteCustom = await app.request(new Request(`http://localhost/api/v1/spells/${created.id}`, { method: "DELETE" }));
    expect(deleteCustom.status).toBe(204);
  });
});
