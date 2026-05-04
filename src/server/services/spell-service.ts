import fs from "node:fs";
import { randomUUID } from "node:crypto";
import type { CreateSpellInput, PatchSpellInput, PutSpellInput, Spell } from "../../shared/schemas.js";
import { ApiError } from "../lib/errors.js";
import { slugify } from "../lib/slug.js";
import { SpellRepository } from "../repositories/spell-repository.js";

const mergePatch = <T extends object>(base: T, patch: Partial<T>): T => ({
  ...base,
  ...patch,
});

export class SpellService {
  constructor(private readonly repository: SpellRepository) {}

  seedOfficialSpells(seedFilePath: string) {
    const spells = JSON.parse(fs.readFileSync(seedFilePath, "utf8")) as Spell[];
    for (const spell of spells) {
      this.repository.upsertOfficialSpell(spell);
    }
  }

  listSpells(query: Parameters<SpellRepository["list"]>[0]) {
    return this.repository.list(query);
  }

  getSpellById(id: string) {
    const spell = this.repository.findById(id);
    if (!spell) {
      throw new ApiError(404, "SPELL_NOT_FOUND", `Spell with id '${id}' was not found.`);
    }

    return spell;
  }

  createCustomSpell(input: CreateSpellInput) {
    const now = new Date().toISOString();
    const spell: Spell = {
      ...input,
      id: `custom-${randomUUID()}`,
      source: "custom",
      slug: slugify(input.name),
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.createSpell(spell);
  }

  replaceCustomSpell(id: string, input: PutSpellInput) {
    const existing = this.getSpellById(id);
    this.ensureMutable(existing);

    const spell: Spell = {
      ...input,
      id: existing.id,
      slug: slugify(input.name),
      source: "custom",
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    return this.repository.updateSpell(spell);
  }

  patchCustomSpell(id: string, input: PatchSpellInput) {
    const existing = this.getSpellById(id);
    this.ensureMutable(existing);

    const merged = mergePatch(existing, input);
    const spell: Spell = {
      ...merged,
      id: existing.id,
      source: "custom",
      slug: slugify(merged.name),
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    return this.repository.updateSpell(spell);
  }

  deleteCustomSpell(id: string) {
    const spell = this.getSpellById(id);
    this.ensureMutable(spell);
    this.repository.deleteSpell(id);
  }

  private ensureMutable(spell: Spell) {
    if (spell.source === "official") {
      throw new ApiError(409, "OFFICIAL_SPELL_READ_ONLY", `Official spell '${spell.id}' is read-only.`);
    }
  }
}
