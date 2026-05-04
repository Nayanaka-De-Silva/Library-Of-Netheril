import { config, resolveFromProjectRoot } from "../config.js";
import { createDbConnection } from "../db/client.js";
import { runMigrations } from "../db/migrator.js";

const main = async () => {
  const connection = await createDbConnection(config.databaseUrl);
  runMigrations(connection, resolveFromProjectRoot("drizzle"));

  console.log(`Applied migrations to ${config.databaseUrl}`);
};

void main();
