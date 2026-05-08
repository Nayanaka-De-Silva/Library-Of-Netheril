import { z } from "zod";
import {
  LEVEL_VALUES,
  LIST_SOURCE_VALUES,
  SPELL_CLASSES,
  SPELL_SCHOOLS,
  SPELL_SOURCES,
} from "./constants.js";

export const spellComponentsSchema = z.object({
  verbal: z.boolean(),
  somatic: z.boolean(),
  material: z.boolean(),
  materialDescription: z.string().nullable(),
});

export const spellSourceSchema = z.enum(SPELL_SOURCES);
export const spellSchoolSchema = z.enum(SPELL_SCHOOLS);
export const spellClassSchema = z.enum(SPELL_CLASSES);
export const spellLevelSchema = z.number().int().min(0).max(9);

export const spellSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  atHigherLevel: z.string().nullable(),
  page: z.string().nullable(),
  range: z.string().min(1),
  components: spellComponentsSchema,
  ritual: z.boolean(),
  duration: z.string().min(1),
  concentration: z.boolean(),
  castingTime: z.string().min(1),
  level: spellLevelSchema,
  school: spellSchoolSchema,
  classes: z.array(spellClassSchema),
  source: spellSourceSchema,
  slug: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const spellSummarySchema = spellSchema.pick({
  id: true,
  name: true,
  level: true,
  school: true,
});

export const spellListQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  search: z.string().trim().min(1).optional(),
  level: spellLevelSchema.optional(),
  school: spellSchoolSchema.optional(),
  classes: z.array(spellClassSchema).default([]),
  ritual: z.boolean().optional(),
  concentration: z.boolean().optional(),
  source: z.enum(LIST_SOURCE_VALUES).default("all"),
  sort: z.literal("name").default("name"),
  direction: z.enum(["asc", "desc"]).default("asc"),
});

export const spellListResponseSchema = z.object({
  data: z.array(spellSummarySchema),
  meta: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

const spellInputBaseSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  description: z.string().trim().min(1, "Description is required."),
  atHigherLevel: z.string().trim().nullable(),
  page: z.string().trim().nullable(),
  range: z.string().trim().min(1, "Range is required."),
  components: spellComponentsSchema,
  ritual: z.boolean(),
  duration: z.string().trim().min(1, "Duration is required."),
  concentration: z.boolean(),
  castingTime: z.string().trim().min(1, "Casting time is required."),
  level: spellLevelSchema,
  school: spellSchoolSchema,
  classes: z.array(spellClassSchema),
});

export const createSpellSchema = spellInputBaseSchema;
export const putSpellSchema = spellInputBaseSchema;
export const patchSpellSchema = spellInputBaseSchema.partial();

export const metadataResponseSchema = z.object({
  schools: z.array(spellSchoolSchema),
  classes: z.array(spellClassSchema),
  levels: z.array(z.number().int().min(0).max(9)),
  sources: z.array(spellSourceSchema),
});

export const apiErrorDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(apiErrorDetailSchema).optional(),
  }),
});

export type Spell = z.infer<typeof spellSchema>;
export type SpellSummary = z.infer<typeof spellSummarySchema>;
export type SpellListQuery = z.infer<typeof spellListQuerySchema>;
export type SpellListResponse = z.infer<typeof spellListResponseSchema>;
export type CreateSpellInput = z.infer<typeof createSpellSchema>;
export type PutSpellInput = z.infer<typeof putSpellSchema>;
export type PatchSpellInput = z.infer<typeof patchSpellSchema>;
