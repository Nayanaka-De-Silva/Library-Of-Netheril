import fs from "node:fs";
import path from "node:path";
import type { DatabaseConnection } from "./client.js";

export const runMigrations = ({ sqlite }: DatabaseConnection, migrationsDir: string) => {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __app_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const appliedRows = sqlite.prepare("SELECT id FROM __app_migrations ORDER BY id").all() as Array<{ id: string }>;
  const applied = new Set<string>(appliedRows.map((row) => row.id));

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    if (applied.has(file)) {
      continue;
    }

    const migrationSql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    const transaction = sqlite.transaction(() => {
      sqlite.exec(migrationSql);
      sqlite
        .prepare("INSERT INTO __app_migrations (id, applied_at) VALUES (?, ?)")
        .run(file, new Date().toISOString());
    });
    transaction();
  }
};
