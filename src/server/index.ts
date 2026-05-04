import { serve } from "@hono/node-server";
import { config, resolveFromProjectRoot } from "./config.js";
import { createDbConnection } from "./db/client.js";
import { runMigrations } from "./db/migrator.js";
import { SpellRepository } from "./repositories/spell-repository.js";
import { SpellService } from "./services/spell-service.js";
import { createApp } from "./app.js";

const main = async () => {
  const connection = await createDbConnection(config.databaseUrl);
  runMigrations(connection, resolveFromProjectRoot("drizzle"));

  const spellRepository = new SpellRepository(connection);
  const spellService = new SpellService(spellRepository);
  spellService.seedOfficialSpells(resolveFromProjectRoot("data", "spells.json"));

  const app = createApp({
    spellService,
    corsOrigin: config.corsOrigin,
    clientDistPath: resolveFromProjectRoot("dist", "client"),
  });

  serve(
    {
      fetch: app.fetch,
      port: config.port,
    },
    (info) => {
      console.log(`Library of Netheril listening on http://localhost:${info.port}`);
    },
  );
};

void main();
