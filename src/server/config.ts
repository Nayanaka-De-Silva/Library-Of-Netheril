import dotenv from "dotenv";
import path from "node:path";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "./.data/library-of-netheril.sqlite",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
};

export const resolveFromProjectRoot = (...parts: string[]) => path.resolve(process.cwd(), ...parts);
