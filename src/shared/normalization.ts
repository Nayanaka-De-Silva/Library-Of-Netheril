import { OFFICIAL_SEED_TIMESTAMP, SPELL_CLASSES, SPELL_SCHOOLS } from "./constants.js";
import { spellSchema, type Spell } from "./schemas.js";

export type RawSpell = {
  name: string;
  desc: string;
  higher_level?: string;
  page?: string;
  range: string;
  components: string;
  material?: string;
  ritual: string;
  duration: string;
  concentration: string;
  casting_time: string;
  level: string;
  school: string;
  classes: string;
};

const allowedClasses = new Set<string>(SPELL_CLASSES);
const allowedSchools = new Set<string>(SPELL_SCHOOLS);

export const decodeEntities = (value: string): string =>
  value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&apos;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…");

export const htmlToText = (html?: string): string | null => {
  if (!html) {
    return null;
  }

  const text = decodeEntities(html)
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text.length ? text : null;
};

export const normalizePage = (page?: string): string | null => {
  if (!page?.trim()) {
    return null;
  }

  return page
    .trim()
    .split(/\s+/)
    .map((part) => (/^\d+$/.test(part) ? part : part.toUpperCase()))
    .join(" ");
};

export const slugifyOfficialSpell = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const extractPageKey = (page: string | null): string => {
  if (!page) {
    return "official";
  }

  return page
    .replace(/\d+/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
};

export const parseBooleanFlag = (value: string): boolean => value.trim().toLowerCase() === "yes";

export const parseSpellLevel = (value: string): number => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "cantrip") {
    return 0;
  }

  const match = normalized.match(/^(\d+)/);
  if (!match) {
    throw new Error(`Unsupported level: ${value}`);
  }

  return Number(match[1]);
};

export const parseComponents = (value: string, material?: string) => {
  const parts = value
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);

  const materialFlag = parts.includes("M");
  return {
    verbal: parts.includes("V"),
    somatic: parts.includes("S"),
    material: materialFlag,
    materialDescription: materialFlag ? material?.trim() || null : null,
  };
};

export const normalizeClasses = (value: string) => {
  const unique = new Set<string>();

  for (const rawClass of value.split(",")) {
    const className = rawClass.trim();
    if (!className || !allowedClasses.has(className)) {
      continue;
    }
    unique.add(className);
  }

  return [...unique];
};

export const normalizeRawSpell = (raw: RawSpell): Spell => {
  if (!allowedSchools.has(raw.school)) {
    throw new Error(`Unsupported school "${raw.school}" for spell "${raw.name}"`);
  }

  const page = normalizePage(raw.page);
  const slug = slugifyOfficialSpell(raw.name);
  const id = `${extractPageKey(page)}-${slug}`;

  return spellSchema.parse({
    id,
    name: raw.name.trim(),
    description: htmlToText(raw.desc),
    atHigherLevel: htmlToText(raw.higher_level),
    page,
    range: raw.range.trim(),
    components: parseComponents(raw.components, raw.material),
    ritual: parseBooleanFlag(raw.ritual),
    duration: raw.duration.trim(),
    concentration: parseBooleanFlag(raw.concentration),
    castingTime: raw.casting_time.trim(),
    level: parseSpellLevel(raw.level),
    school: raw.school,
    classes: normalizeClasses(raw.classes),
    source: "official",
    slug,
    createdAt: OFFICIAL_SEED_TIMESTAMP,
    updatedAt: OFFICIAL_SEED_TIMESTAMP,
  });
};
