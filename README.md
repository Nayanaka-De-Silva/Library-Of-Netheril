# Library of Netheril

API-first D&D 5e spell library built as a single TypeScript project with:

- SolidJS frontend
- Hono REST API
- SQLite + Drizzle ORM
- Vitest tests
- Docker packaging

## Project structure

- `src/client` - SolidJS SPA
- `src/server` - Hono API and SQLite bootstrap
- `src/shared` - shared types, schemas, and normalization
- `data/spells.json` - canonical official spell seed data
- `drizzle/0000_initial.sql` - committed migration history

## Local setup

```bash
npm install
bun run seed:canonicalize
npm run build
npm test
```

### Development

Run the API and Vite client together:

```bash
npm run dev
```

- API: `http://localhost:3000`
- Web app: `http://localhost:5173`
- OpenAPI document: `http://localhost:3000/api/v1/openapi.json`

### Production-style local run

```bash
npm run build
npm run start
```

## Environment

Copy `.env.example` to `.env` if needed.

- `PORT` - HTTP port, default `3000`
- `DATABASE_URL` - SQLite file path, default `./.data/library-of-netheril.sqlite`
- `CORS_ORIGIN` - `*` or a comma-separated allowlist

`CORS_ORIGIN=*` is convenient for local work but should only be used in trusted environments.

## Canonical seed file

`data/spells.json` is the committed canonical official dataset used at runtime.

Each spell includes:

- stable `id`
- `slug`
- normalized plain-text `description`
- normalized booleans and numeric `level`
- controlled `school` and `classes`
- `source: "official"`
- deterministic seed timestamps

The raw source file at project root (`spells.json`) is only used to generate the canonical file.

## API summary

Base path: `/api/v1`

- `GET /health`
- `GET /spells`
- `GET /spells/:id`
- `POST /spells`
- `PUT /spells/:id`
- `PATCH /spells/:id`
- `DELETE /spells/:id`
- `GET /metadata`
- `GET /openapi.json`

### Error format

```json
{
  "error": {
    "code": "SPELL_NOT_FOUND",
    "message": "Spell with id 'phb-fireball' was not found."
  }
}
```

Validation errors use `VALIDATION_ERROR` and may include `details`.

## Docker

Build and run:

```bash
docker compose up --build
```

The container exposes one HTTP port on `3000` and stores SQLite data in a persistent Docker volume mounted at `/app/persist`.

## Validation commands

```bash
npm run typecheck
npm run build
npm test
```
