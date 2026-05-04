# Library of Netheril

**Tagline:** An API-first D&D 5e spell library for web interfaces and external tool integration.

## 1. Product Summary

Library of Netheril is a JavaScript web application whose primary purpose is to serve as the single source of truth for Dungeons & Dragons 5th Edition (2014) spell data.

The application has two equally important surfaces:

1. A responsive web interface for browsing, searching, filtering, and reading spells.
2. A public REST API that other applications can consume directly.

The REST API is the primary product surface. The web UI must use the same public API that external applications use.

## 2. Primary Integration Goal

This project must integrate cleanly with **Many Faced God (MFG)** and any future tooling that needs spell references.

The integration contract is:

- External systems store only the spell's stable `id`.
- External systems retrieve spell data on demand from Library of Netheril.
- Spell IDs must remain stable across imports, restarts, and deployments.
- Official seeded spells are read-only.
- Custom spells created by the user must also receive stable IDs and remain retrievable until explicitly deleted.

## 3. Goals

- Provide a reliable catalog of D&D 5e (2014) spells.
- Support fast spell lookup by ID for downstream applications.
- Support paginated spell listing with filtering.
- Allow creation and management of custom spells.
- Run as a single Dockerized application on both `x86_64` and `arm64`.
- Use one codebase for both the frontend and backend.
- Be straightforward for an AI coding agent to build without guessing missing requirements.

## 4. Non-Goals

- No authentication or user accounts in the first version.
- No multi-tenant behavior.
- No per-campaign spell overrides.
- No support for non-2014 D&D editions in the first version.
- No GraphQL API.

## 5. Required Technology Choices

These choices are intentionally explicit to remove ambiguity for implementation agents.

- **Language:** TypeScript for all application code.
- **Runtime:** Bun-compatible JavaScript runtime.
- **Frontend:** SolidJS.
- **Backend API framework:** Hono.
- **Database:** SQLite for the first version.
- **ORM / database layer:** Drizzle ORM.
- **Containerization:** Docker.
- **API style:** REST with JSON responses.
- **Testing:** Vitest for unit and integration tests.

JavaScript is only the runtime output target. Source files should be authored in TypeScript, not plain JavaScript, unless a tool-generated file requires otherwise.

## 6. High-Level Architecture

The application must be a single project with a clear internal separation of concerns:

- `src/client` - SolidJS frontend
- `src/server` - Hono API server
- `src/shared` - shared types, schemas, constants, and API contracts
- `data/spells.json` - official seed data loaded into the database

The frontend must not bypass the API to access spell data directly. The browser UI should call the same REST endpoints that MFG or any other external tool would call.

## 7. Data Ownership Rules

- **Official spells** come from `data/spells.json`.
- Official spells are seeded automatically when the app starts.
- Official spells are read-only through the API.
- **Custom spells** are created through the application and stored in the same database.
- Custom spells can be created, updated, and deleted through the API and the UI.

## 8. Seed Data Rules

`data/spells.json` is the canonical source for official spells.

Startup behavior must be deterministic and idempotent:

1. Ensure the database schema exists.
2. Import official spells from `data/spells.json`.
3. Match official spell records by `id`.
4. If an official spell already exists, update its stored data from the seed file.
5. Do not duplicate official spells on restart.
6. Do not modify or delete custom spells during the seed process.

## 9. Spell Data Model

Every spell record must use the following fields.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Stable, unique identifier used by external systems. |
| `name` | string | yes | Spell name. |
| `description` | string | yes | Full spell description as plain text. |
| `atHigherLevel` | string \| null | no | Extra effect text when cast at higher levels. |
| `page` | string \| null | no | Source page reference, for example `PHB 241`. |
| `range` | string | yes | Human-readable range text. |
| `components.verbal` | boolean | yes | Whether the spell has a verbal component. |
| `components.somatic` | boolean | yes | Whether the spell has a somatic component. |
| `components.material` | boolean | yes | Whether the spell has a material component. |
| `components.materialDescription` | string \| null | no | Material component description if applicable. |
| `ritual` | boolean | yes | Whether the spell can be cast as a ritual. |
| `duration` | string | yes | Human-readable duration text. |
| `concentration` | boolean | yes | Whether the spell requires concentration. |
| `castingTime` | string | yes | Human-readable casting time text. |
| `level` | integer | yes | `0-9`, where `0` means cantrip. |
| `school` | string | yes | Controlled value from the spell school list. |
| `classes` | string[] | yes | Controlled list of classes that can cast the spell. |
| `source` | string | yes | `official` or `custom`. |
| `slug` | string | yes | URL-safe slug used by the frontend. |
| `createdAt` | string | yes | ISO 8601 timestamp. |
| `updatedAt` | string | yes | ISO 8601 timestamp. |

### Controlled Values

Allowed spell schools:

- Abjuration
- Conjuration
- Divination
- Enchantment
- Evocation
- Illusion
- Necromancy
- Transmutation

Allowed class names:

- Artificer
- Bard
- Cleric
- Druid
- Paladin
- Ranger
- Sorcerer
- Warlock
- Wizard

## 10. Spell ID Rules

Stable IDs are mandatory because MFG and similar tools will store them.

- Official spells must use a deterministic string ID supplied by `data/spells.json`.
- Official spell IDs must never be regenerated from runtime state.
- Custom spells must use IDs in the format `custom-<uuid>`.
- IDs are immutable after creation.
- The API must allow lookup by `id`, not by `name`.

## 11. API Requirements

### Base Path

All public API endpoints must live under:

`/api/v1`

### Content Rules

- Request and response bodies use JSON.
- `Content-Type: application/json` is required for JSON request bodies.
- All timestamps use ISO 8601 strings.
- The API must return explicit error responses and correct HTTP status codes.

### Required Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Health check for containers and clients. |
| `GET` | `/api/v1/spells` | Paginated spell summary list with filters. |
| `GET` | `/api/v1/spells/:id` | Full spell detail lookup by stable ID. |
| `POST` | `/api/v1/spells` | Create a custom spell. |
| `PUT` | `/api/v1/spells/:id` | Replace a custom spell. |
| `PATCH` | `/api/v1/spells/:id` | Partially update a custom spell. |
| `DELETE` | `/api/v1/spells/:id` | Delete a custom spell. |
| `GET` | `/api/v1/metadata` | Return filter metadata such as schools, levels, and classes. |
| `GET` | `/api/v1/openapi.json` | Machine-readable API specification. |

### `GET /api/v1/spells`

This endpoint is optimized for search and selection screens.

It must return only spell summary data:

- `id`
- `name`

#### Query Parameters

| Query Param | Type | Notes |
| --- | --- | --- |
| `page` | integer | Default `1`. Minimum `1`. |
| `pageSize` | integer | Default `25`. Minimum `1`. Maximum `100`. |
| `search` | string | Case-insensitive match against spell name. |
| `level` | integer | Filter `0-9`. |
| `school` | string | One of the controlled school values. |
| `class` | string | One controlled class value per query parameter instance. Repeating is allowed. |
| `ritual` | boolean | `true` or `false`. |
| `concentration` | boolean | `true` or `false`. |
| `source` | string | `official`, `custom`, or `all`. Default `all`. |
| `sort` | string | Only `name` is required for v1. |
| `direction` | string | `asc` or `desc`. Default `asc`. |

#### Response Shape

```json
{
  "data": [
    {
      "id": "phb-fireball",
      "name": "Fireball"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

### `GET /api/v1/spells/:id`

Returns the full spell record using the schema defined in section 9.

If the spell does not exist, return:

- HTTP `404`
- error code `SPELL_NOT_FOUND`

### `POST /api/v1/spells`

Creates a new custom spell.

Rules:

- `source` must always be set internally to `custom`.
- The server generates the `id`.
- The server generates `createdAt` and `updatedAt`.
- The request body must not be allowed to create or overwrite official spells.

Return:

- HTTP `201` on success
- Full created spell object in the response body

### `PUT /api/v1/spells/:id` and `PATCH /api/v1/spells/:id`

These endpoints only apply to custom spells.

If the target spell is official, return:

- HTTP `409`
- error code `OFFICIAL_SPELL_READ_ONLY`

### `DELETE /api/v1/spells/:id`

This endpoint only applies to custom spells.

If deletion succeeds, return HTTP `204`.

If the target spell is official, return:

- HTTP `409`
- error code `OFFICIAL_SPELL_READ_ONLY`

### `GET /api/v1/metadata`

This endpoint exists so UI clients and external tools do not hardcode filter options.

It must return at least:

- available spell schools
- available class names
- supported level values (`0-9`)
- supported `source` values

## 12. API Error Format

All API errors must use this JSON shape:

```json
{
  "error": {
    "code": "SPELL_NOT_FOUND",
    "message": "Spell with id 'phb-fireball' was not found."
  }
}
```

Validation errors may include a `details` array:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request body failed validation.",
    "details": [
      {
        "field": "level",
        "message": "Level must be between 0 and 9."
      }
    ]
  }
}
```

## 13. Validation Rules

- `name` must be non-empty.
- `description` must be non-empty.
- `level` must be an integer from `0` to `9`.
- `school` must be a supported school value.
- `classes` must contain only supported class values.
- `classes` may be empty for unusual custom spells, but official spells should use canonical class data.
- `pageSize` must never exceed `100`.
- Unknown filter query parameters should be ignored, not treated as fatal errors.
- Invalid filter values must return HTTP `400` with `VALIDATION_ERROR`.

## 14. Frontend Requirements

The frontend is secondary to the API, but it must still be complete and usable.

### Required Pages

- `/` - redirects to `/spells`
- `/spells` - searchable and filterable spell list
- `/spells/:id` - spell detail view
- `/spells/new` - create custom spell form
- `/spells/:id/edit` - edit custom spell form

### UI Behavior

- Default theme is dark with a blue accent palette.
- The UI must be responsive on desktop, tablet, and mobile widths.
- The spell list page must allow filtering by:
  - name search
  - level
  - school
  - class
  - ritual
  - concentration
  - source
- Clicking a spell in the list opens its detail page.
- The detail page displays spell data in a readable card-style layout centered on the screen.
- Official and custom spells must be visually distinguishable.
- The frontend must gracefully handle empty states, loading states, and API error states.

## 15. Integration Requirements for Many Faced God

The API must be simple enough for MFG to consume without custom translation logic.

Required guarantees:

- `GET /api/v1/spells/:id` is the canonical lookup endpoint.
- A spell referenced by ID must return the same core identity fields every time unless the spell is intentionally edited.
- The list endpoint must be lightweight enough for spell-picker UIs.
- The API must support CORS.

### CORS Rules

- CORS must be configurable by environment variable.
- Default local development behavior may allow all origins.
- The app must document that unrestricted CORS is intended for trusted environments only.

## 16. Docker and Runtime Requirements

- The app must run in Docker with a single command path for local development and deployment.
- The Docker image must support both `x86_64` and `arm64`.
- The container must expose a single HTTP port.
- SQLite data must be stored in a mounted volume so custom spells survive container recreation.
- The image should use a multi-stage build to keep runtime size reasonable.

## 17. Testing Requirements

The project should follow a test-driven mindset.

Required automated coverage:

- unit tests for validation and data transformation logic
- integration tests for seed import behavior
- integration tests for all REST endpoints
- contract tests for:
  - stable spell lookup by ID
  - pagination response shape
  - filtering behavior
  - official spell read-only enforcement

## 18. Documentation Requirements

The built project must include:

- a `README.md` with setup, development, and Docker usage
- API usage documentation
- generated or maintained OpenAPI output at `/api/v1/openapi.json`
- a short explanation of the seed file format for `data/spells.json`

## 19. Acceptance Criteria

The first release is complete when all of the following are true:

1. The app starts successfully in Docker.
2. Official spells load from `data/spells.json` without duplication across restarts.
3. The web UI can browse, filter, and open spell detail pages.
4. External applications can retrieve spell summaries from `GET /api/v1/spells`.
5. External applications can retrieve full spell details from `GET /api/v1/spells/:id`.
6. Custom spells can be created, edited, and deleted.
7. Official seeded spells cannot be edited or deleted through the API.
8. The frontend uses the public API rather than a separate private data path.
9. API responses and errors follow the documented shapes.
10. The application works on both `x86_64` and `arm64` Docker targets.

## 20. Implementation Notes for AI Agents

Implementation agents should treat this project as an **API-first, single-repo TypeScript application**.

Do not improvise alternate requirements unless explicitly requested. In particular:

- do not introduce authentication in v1
- do not replace the public API with server-only data access for the frontend
- do not make official seeded spells editable
- do not use unstable IDs
- do not return full spell objects from the list endpoint
- do not move away from SolidJS, Hono, Bun compatibility, SQLite, or Docker unless the requirements document is updated first
