import fs from "node:fs";
import path from "node:path";

type SqliteStatement<Row = unknown> = {
  all(...params: unknown[]): Row[];
  get(...params: unknown[]): Row | undefined;
  run(...params: unknown[]): unknown;
};

type SqliteLike = {
  exec(sql: string): unknown;
  prepare<Row = unknown>(sql: string): SqliteStatement<Row>;
  transaction<T extends (...args: never[]) => unknown>(fn: T): T;
};

type DrizzleLikeDatabase = {
  select(...args: unknown[]): any;
  insert(...args: unknown[]): any;
  update(...args: unknown[]): any;
  delete(...args: unknown[]): any;
};

export type DatabaseConnection = {
  sqlite: SqliteLike;
  db: DrizzleLikeDatabase;
  runtime: "bun" | "node";
};

const ensureDatabaseDirectory = (databaseUrl: string) => {
  if (databaseUrl !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(databaseUrl)), { recursive: true });
  }
};

const isBunRuntime = () => typeof globalThis === "object" && "Bun" in globalThis;

export const createDbConnection = async (databaseUrl: string): Promise<DatabaseConnection> => {
  ensureDatabaseDirectory(databaseUrl);

  if (isBunRuntime()) {
    const [{ Database }, { drizzle }] = await Promise.all([import("bun:sqlite"), import("drizzle-orm/bun-sqlite")]);
    const sqlite = new Database(databaseUrl, { create: true });
    sqlite.exec("PRAGMA journal_mode = WAL;");
    sqlite.exec("PRAGMA foreign_keys = ON;");

    return {
      sqlite: sqlite as SqliteLike,
      db: drizzle(sqlite) as DrizzleLikeDatabase,
      runtime: "bun",
    };
  }

  const [{ default: Database }, { drizzle }] = await Promise.all([
    import("better-sqlite3"),
    import("drizzle-orm/better-sqlite3"),
  ]);

  const sqlite = new Database(databaseUrl);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  return {
    sqlite: sqlite as SqliteLike,
    db: drizzle(sqlite) as DrizzleLikeDatabase,
    runtime: "node",
  };
};
