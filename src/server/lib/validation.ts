import { ZodError } from "zod";
import { LEVEL_VALUES, LIST_SOURCE_VALUES, SPELL_CLASSES, SPELL_SCHOOLS, SPELL_SOURCES } from "../../shared/constants.js";
import {
  createSpellSchema,
  patchSpellSchema,
  putSpellSchema,
  spellListQuerySchema,
  type CreateSpellInput,
  type PatchSpellInput,
  type PutSpellInput,
  type SpellListQuery,
} from "../../shared/schemas.js";
import { validationError } from "./errors.js";

const parseOptionalBoolean = (value: string | null) => {
  if (value === null) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
};

const parseOptionalNumber = (value: string | null) => {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const toValidationDetails = (error: ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join(".") || "request",
    message: issue.message,
  }));

export const parseSpellListQuery = (url: URL): SpellListQuery => {
  const result = spellListQuerySchema.safeParse({
    page: parseOptionalNumber(url.searchParams.get("page")),
    pageSize: parseOptionalNumber(url.searchParams.get("pageSize")),
    search: url.searchParams.get("search") ?? undefined,
    level: parseOptionalNumber(url.searchParams.get("level")),
    school: url.searchParams.get("school") ?? undefined,
    classes: url.searchParams.getAll("class"),
    ritual: parseOptionalBoolean(url.searchParams.get("ritual")),
    concentration: parseOptionalBoolean(url.searchParams.get("concentration")),
    source: url.searchParams.get("source") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    direction: url.searchParams.get("direction") ?? undefined,
  });

  if (!result.success) {
    throw validationError("Request query failed validation.", toValidationDetails(result.error));
  }

  return result.data;
};

export const parseCreateSpellInput = (value: unknown): CreateSpellInput => {
  const result = createSpellSchema.safeParse(value);
  if (!result.success) {
    throw validationError("Request body failed validation.", toValidationDetails(result.error));
  }
  return result.data;
};

export const parsePutSpellInput = (value: unknown): PutSpellInput => {
  const result = putSpellSchema.safeParse(value);
  if (!result.success) {
    throw validationError("Request body failed validation.", toValidationDetails(result.error));
  }
  return result.data;
};

export const parsePatchSpellInput = (value: unknown): PatchSpellInput => {
  const result = patchSpellSchema.safeParse(value);
  if (!result.success) {
    throw validationError("Request body failed validation.", toValidationDetails(result.error));
  }
  return result.data;
};

export const metadataPayload = {
  schools: [...SPELL_SCHOOLS],
  classes: [...SPELL_CLASSES],
  levels: [...LEVEL_VALUES],
  sources: [...SPELL_SOURCES],
  listSources: [...LIST_SOURCE_VALUES],
};
