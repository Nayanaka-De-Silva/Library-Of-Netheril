import path from "node:path";
import { createApp } from "../../src/server/app";
import { createDbConnection } from "../../src/server/db/client";
import { runMigrations } from "../../src/server/db/migrator";
import { SpellRepository } from "../../src/server/repositories/spell-repository";
import { SpellService } from "../../src/server/services/spell-service";

type TestContextOptions = {
  clientDistPath?: string;
};

export const createTestContext = async ({ clientDistPath }: TestContextOptions = {}) => {
  const connection = await createDbConnection(":memory:");
  runMigrations(connection, path.resolve(process.cwd(), "drizzle"));

  const repository = new SpellRepository(connection);
  const service = new SpellService(repository);
  service.seedOfficialSpells(path.resolve(process.cwd(), "data/spells.json"));

  const app = createApp({
    spellService: service,
    corsOrigin: "*",
    clientDistPath,
  });

  return {
    connection,
    repository,
    service,
    app,
  };
};
