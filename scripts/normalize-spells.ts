import fs from "node:fs";
import path from "node:path";
import { normalizeRawSpell, type RawSpell } from "../src/shared/normalization.js";

const sourceFile = path.resolve("spells.json");
const outputFile = path.resolve("data/spells.json");

const rawSpells = JSON.parse(fs.readFileSync(sourceFile, "utf8")) as RawSpell[];
const normalized = rawSpells.map(normalizeRawSpell);

const uniqueIds = new Set(normalized.map((spell) => spell.id));
if (uniqueIds.size !== normalized.length) {
  throw new Error("Duplicate ids detected during normalization.");
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(normalized, null, 2)}\n`);

console.log(`Normalized ${normalized.length} spells into ${path.relative(process.cwd(), outputFile)}.`);
