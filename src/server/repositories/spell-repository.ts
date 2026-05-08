import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { DatabaseConnection } from "../db/client.js";
import { spellsTable } from "../db/schema.js";
import type { Spell, SpellListQuery, SpellSummary } from "../../shared/schemas.js";

const serializeSpell = (spell: Spell) => ({
  id: spell.id,
  name: spell.name,
  description: spell.description,
  atHigherLevel: spell.atHigherLevel,
  page: spell.page,
  range: spell.range,
  componentVerbal: spell.components.verbal,
  componentSomatic: spell.components.somatic,
  componentMaterial: spell.components.material,
  materialDescription: spell.components.materialDescription,
  ritual: spell.ritual,
  duration: spell.duration,
  concentration: spell.concentration,
  castingTime: spell.castingTime,
  level: spell.level,
  school: spell.school,
  classes: JSON.stringify(spell.classes),
  source: spell.source,
  slug: spell.slug,
  createdAt: spell.createdAt,
  updatedAt: spell.updatedAt,
});

const deserializeSpell = (row: typeof spellsTable.$inferSelect): Spell => ({
  id: row.id,
  name: row.name,
  description: row.description,
  atHigherLevel: row.atHigherLevel,
  page: row.page,
  range: row.range,
  components: {
    verbal: row.componentVerbal,
    somatic: row.componentSomatic,
    material: row.componentMaterial,
    materialDescription: row.materialDescription,
  },
  ritual: row.ritual,
  duration: row.duration,
  concentration: row.concentration,
  castingTime: row.castingTime,
  level: row.level,
  school: row.school as Spell["school"],
  classes: JSON.parse(row.classes) as Spell["classes"],
  source: row.source as Spell["source"],
  slug: row.slug,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class SpellRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  upsertOfficialSpell(spell: Spell) {
    this.connection.db
      .insert(spellsTable)
      .values(serializeSpell(spell))
      .onConflictDoUpdate({
        target: spellsTable.id,
        set: serializeSpell(spell),
      })
      .run();
  }

  createSpell(spell: Spell) {
    this.connection.db.insert(spellsTable).values(serializeSpell(spell)).run();
    return spell;
  }

  updateSpell(spell: Spell) {
    this.connection.db.update(spellsTable).set(serializeSpell(spell)).where(eq(spellsTable.id, spell.id)).run();
    return spell;
  }

  deleteSpell(id: string) {
    this.connection.db.delete(spellsTable).where(eq(spellsTable.id, id)).run();
  }

  findById(id: string): Spell | null {
    const row = this.connection.db.select().from(spellsTable).where(eq(spellsTable.id, id)).get();
    return row ? deserializeSpell(row) : null;
  }

  list(query: SpellListQuery): { data: SpellSummary[]; totalItems: number; totalPages: number } {
    const conditions = [];

    if (query.search) {
      conditions.push(sql`lower(${spellsTable.name}) like ${`%${query.search.toLowerCase()}%`}`);
    }

    if (typeof query.level === "number") {
      conditions.push(eq(spellsTable.level, query.level));
    }

    if (query.school) {
      conditions.push(eq(spellsTable.school, query.school));
    }

    if (typeof query.ritual === "boolean") {
      conditions.push(eq(spellsTable.ritual, query.ritual));
    }

    if (typeof query.concentration === "boolean") {
      conditions.push(eq(spellsTable.concentration, query.concentration));
    }

    if (query.source !== "all") {
      conditions.push(eq(spellsTable.source, query.source));
    }

    if (query.classes.length > 0) {
      const classClauses = query.classes.map((className: string) => sql`value = ${className}`);
      conditions.push(
        sql`exists (
          select 1
          from json_each(${spellsTable.classes})
          where ${sql.join(classClauses, sql` or `)}
        )`,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const orderBy = query.direction === "desc" ? desc(spellsTable.name) : asc(spellsTable.name);
    const offset = (query.page - 1) * query.pageSize;

    const dataRows = this.connection.db
      .select({
        id: spellsTable.id,
        name: spellsTable.name,
        level: spellsTable.level,
        school: spellsTable.school,
      })
      .from(spellsTable)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(query.pageSize)
      .offset(offset)
      .all();

    const countResult = this.connection.db
      .select({ count: sql<number>`count(*)` })
      .from(spellsTable)
      .where(whereClause)
      .get();

    const totalItems = countResult?.count ?? 0;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize);

    return {
      data: dataRows,
      totalItems,
      totalPages,
    };
  }
}
