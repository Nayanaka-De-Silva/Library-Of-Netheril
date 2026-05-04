export const SPELL_SCHOOLS = [
  "Abjuration",
  "Conjuration",
  "Divination",
  "Enchantment",
  "Evocation",
  "Illusion",
  "Necromancy",
  "Transmutation",
] as const;

export const SPELL_CLASSES = [
  "Artificer",
  "Bard",
  "Cleric",
  "Druid",
  "Paladin",
  "Ranger",
  "Sorcerer",
  "Warlock",
  "Wizard",
] as const;

export const SPELL_SOURCES = ["official", "custom"] as const;
export const LIST_SOURCE_VALUES = ["official", "custom", "all"] as const;
export const LEVEL_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const API_BASE_PATH = "/api/v1";
export const OFFICIAL_SEED_TIMESTAMP = "2024-01-01T00:00:00.000Z";
