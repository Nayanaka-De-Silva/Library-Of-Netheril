CREATE TABLE IF NOT EXISTS spells (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  at_higher_level TEXT,
  page TEXT,
  range TEXT NOT NULL,
  component_verbal INTEGER NOT NULL,
  component_somatic INTEGER NOT NULL,
  component_material INTEGER NOT NULL,
  material_description TEXT,
  ritual INTEGER NOT NULL,
  duration TEXT NOT NULL,
  concentration INTEGER NOT NULL,
  casting_time TEXT NOT NULL,
  level INTEGER NOT NULL,
  school TEXT NOT NULL,
  classes TEXT NOT NULL,
  source TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS spells_name_idx ON spells(name);
CREATE INDEX IF NOT EXISTS spells_slug_idx ON spells(slug);
CREATE INDEX IF NOT EXISTS spells_source_idx ON spells(source);
CREATE INDEX IF NOT EXISTS spells_level_idx ON spells(level);
CREATE INDEX IF NOT EXISTS spells_school_idx ON spells(school);
