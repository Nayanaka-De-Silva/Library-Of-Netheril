# Library of Netheril

An **API-first** spell library for Dungeons & Dragons 5th Edition (2014). Library of
Netheril is the single source of truth for spell data across a suite of tabletop
tools: other apps store only a stable spell `id` and fetch the full record from
this service on demand.

The REST API is the primary surface. The bundled web UI is a client of that same
public API — it has no private data path.

> Part of a suite of self-hosted tabletop tools, each built in a different stack:
> **Library of Netheril** (spells · TypeScript/SolidJS/Hono) ·
> [Many Faced God](https://github.com/Nayanaka-De-Silva/Many-Faced-God) (NPCs · Laravel) ·
> [Bank of Vivaldi](https://github.com/Nayanaka-De-Silva/Bank-Of-Vivaldi) (inventory · Go) ·
> [Manticore Arena](https://github.com/Nayanaka-De-Silva/Manticore-Arena) (combat tracker · TypeScript).

## Features

- **Browse and search** the full 2014 spell list — filter by level, school, class,
  ritual, concentration, and source; sort by name.
- **Spell detail pages** in a readable card layout, with higher-level effects,
  components, and source page references.
- **Custom spells** — create, edit, and delete homebrew spells through the UI or the
  API. Custom spells get stable `custom-<uuid>` IDs and live alongside official
  data.
- **Official spells are read-only** — attempts to edit or delete them return a
  `409 OFFICIAL_SPELL_READ_ONLY`.
- **Idempotent seeding** — official spells load from `data/spells.json` on every
  boot, matched by `id`, without duplicating rows or touching custom spells.
- **Stable IDs** — official spell IDs come from the seed file and are never
  regenerated from runtime state, so downstream references never break.
- **Machine-readable contract** — OpenAPI document served at
  `/api/v1/openapi.json`.
- **Configurable CORS** so browser-based tools can call the API cross-origin.

## Tech stack

| Layer | Choice |
|---|---|
| Language | TypeScript (all application code) |
| Runtime | Bun for dev and production start; Node build target via `tsc` |
| Frontend | SolidJS + `@solidjs/router`, built with Vite |
| API framework | Hono, with `@hono/zod-validator` |
| Database | SQLite via `better-sqlite3` |
| Schema / queries | Drizzle ORM + Drizzle Kit migrations |
| Validation | Zod (shared client/server schemas) |
| Tests | Vitest (+ `@solidjs/testing-library`, jsdom) |
| Packaging | Multi-stage Docker image, `x86_64` and `arm64` |
| CI/CD | Woodpecker |

## Architecture

One repository, one deployable, clear internal seams:

```
src/
  client/        SolidJS SPA — components, pages, API client. Talks only to /api/v1.
  server/        Hono API, SQLite bootstrap, seeding, repositories, services.
  shared/        Types, Zod schemas, and normalization shared by both sides.
data/spells.json canonical official seed data (committed)
drizzle/         committed SQL migration history
```

The frontend never imports server code or reaches the database directly — it uses
the exact endpoints an external integrator would.

## Quick start

Requires Node and either Bun or npm. Docker optional.

```bash
npm install
npm run seed:canonicalize   # regenerate data/spells.json from the raw source
npm run build
npm test
```

### Development

Run the API and the Vite client together:

```bash
npm run dev
```

- API: <http://localhost:3000>
- Web app: <http://localhost:5173>
- OpenAPI document: <http://localhost:3000/api/v1/openapi.json>

### Production-style local run

```bash
npm run build
npm run start
```

### Docker

```bash
docker compose up --build
```

One HTTP port on `3000`; SQLite data persists in a Docker volume mounted at
`/app/persist`.

## Configuration

Copy `.env.example` to `.env` to override defaults.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DATABASE_URL` | `./.data/library-of-netheril.sqlite` | SQLite file path |
| `CORS_ORIGIN` | `*` | `*` or a comma-separated allowlist |

`CORS_ORIGIN=*` is convenient locally but should only be used in trusted
environments.

## API

Base path: `/api/v1`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/spells` | Paginated **summary** list (`id`, `name` only) with filters |
| `GET` | `/spells/:id` | Full spell record by stable ID |
| `POST` | `/spells` | Create a custom spell (server mints `id`, timestamps, `source: custom`) |
| `PUT` | `/spells/:id` | Replace a custom spell |
| `PATCH` | `/spells/:id` | Partially update a custom spell |
| `DELETE` | `/spells/:id` | Delete a custom spell |
| `GET` | `/metadata` | Filter vocabularies — schools, classes, levels, sources |
| `GET` | `/openapi.json` | Machine-readable specification |

**List filters:** `page`, `pageSize` (max 100), `search`, `level`, `school`,
`class` (repeatable), `ritual`, `concentration`, `source` (`official` / `custom` /
`all`), `sort`, `direction`. Unknown query parameters are ignored; invalid values
return `400 VALIDATION_ERROR`.

**Envelopes:** list responses are
`{"data": [...], "meta": {"page", "pageSize", "totalItems", "totalPages"}}`.

**Error format:**

```json
{
  "error": {
    "code": "SPELL_NOT_FOUND",
    "message": "Spell with id 'phb-fireball' was not found."
  }
}
```

Validation errors use `VALIDATION_ERROR` and may include a `details` array.

## Seed data

`data/spells.json` is the committed canonical dataset loaded at runtime. Each record
carries a stable `id`, a `slug`, a normalized plain-text `description`, normalized
booleans and a numeric `level`, controlled `school` and `classes`, `source`, and
deterministic timestamps. The raw file at the project root (`spells.json`) is only
an input to `npm run seed:canonicalize`, which produces the canonical file.

Full data model and API contract: [`docs/spec.md`](docs/spec.md).

## Testing

```bash
npm run typecheck
npm run build
npm test
```

Coverage spans validation and transformation units, seed-import integration,
every REST endpoint, and contract tests for stable lookup, pagination shape,
filtering, and official-spell read-only enforcement.

## Deployment

`.woodpecker.yml` runs `verify` (`npm ci`, typecheck, build, test) on every push and
pull request, then `build-image` and `deploy` on pushes to `main` — building the
image against the runner host's Docker socket and recreating the service from
`docker-compose.prod.yml`, no registry involved.

For a manual production host, use `docker-compose.prod.yml` as the template placed
on the host as `docker-compose.yml`:

```bash
mkdir -p /opt/stacks/library-of-netheril
cp docker-compose.prod.yml /opt/stacks/library-of-netheril/docker-compose.yml
cd /opt/stacks/library-of-netheril
# create .env with production values first
APP_IMAGE=library-of-netheril:latest \
  docker compose up -d --force-recreate --no-build --remove-orphans --wait --wait-timeout 120
```

The named volume keeps the SQLite database mounted at `/app/persist`, so
`--force-recreate` swaps the container without wiping data. Production `.env` keys:
`APP_IMAGE`, `APP_PORT`, `PORT`, `DATABASE_URL`, `CORS_ORIGIN`.

## How it fits the suite

[Many Faced God](https://github.com/Nayanaka-De-Silva/Many-Faced-God) and
[Manticore Arena](https://github.com/Nayanaka-De-Silva/Manticore-Arena) both read
spell data from this service by stable `id`, over a shared Docker network, using the
same public `/api/v1` endpoints documented above.

## Content and licensing

The application code is original and released under the [MIT License](LICENSE).

The bundled `data/spells.json` contains Dungeons & Dragons 5e spell reference text.
Dungeons & Dragons is a trademark of Wizards of the Coast; this is a personal,
non-commercial tool and is not affiliated with or endorsed by Wizards of the Coast.
If you fork this for anything beyond personal use, replace the seed file with
content you are licensed to distribute — for example the
[SRD 5.1](https://dnd.wizards.com/resources/systems-reference-document), released
under CC-BY-4.0.
