import fs from "node:fs";
import path from "node:path";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { ApiError } from "./lib/errors.js";
import { buildOpenApiDocument } from "./lib/openapi.js";
import {
  metadataPayload,
  parseCreateSpellInput,
  parsePatchSpellInput,
  parsePutSpellInput,
  parseSpellListQuery,
} from "./lib/validation.js";
import type { SpellService } from "./services/spell-service.js";
import { API_BASE_PATH } from "../shared/constants.js";

type CreateAppOptions = {
  spellService: SpellService;
  corsOrigin: string;
  clientDistPath?: string;
};

const staticContentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const readStaticFile = async (filePath: string) =>
  new Response(await fs.promises.readFile(filePath), {
    headers: {
      "Content-Type": staticContentTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
    },
  });

const getJsonBody = async (request: Request) => {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "VALIDATION_ERROR", "Request body failed validation.");
  }
};

const parseCorsOrigin = (value: string) => {
  if (value === "*") {
    return "*";
  }

  const allowed = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return (origin: string) => (allowed.includes(origin) ? origin : allowed[0] ?? "");
};

export const createApp = ({ spellService, corsOrigin, clientDistPath }: CreateAppOptions) => {
  const app = new Hono();

  app.use(`${API_BASE_PATH}/*`, cors({ origin: parseCorsOrigin(corsOrigin) }));

  app.onError((error, c) => {
    const apiError =
      error instanceof ApiError
        ? error
        : new ApiError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred.");

    return c.json(
      {
        error: {
          code: apiError.code,
          message: apiError.message,
          ...(apiError.details ? { details: apiError.details } : {}),
        },
      },
      apiError.status as 400 | 404 | 409 | 500,
    );
  });

  app.get(`${API_BASE_PATH}/health`, (c) =>
    c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
  );

  app.get(`${API_BASE_PATH}/spells`, (c) => {
    const query = parseSpellListQuery(new URL(c.req.url));
    const result = spellService.listSpells(query);
    return c.json({
      data: result.data,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      },
    });
  });

  app.get(`${API_BASE_PATH}/spells/:id`, (c) => c.json(spellService.getSpellById(c.req.param("id"))));

  app.post(`${API_BASE_PATH}/spells`, async (c) => {
    const body = await getJsonBody(c.req.raw);
    const created = spellService.createCustomSpell(parseCreateSpellInput(body));
    return c.json(created, 201);
  });

  app.put(`${API_BASE_PATH}/spells/:id`, async (c) => {
    const body = await getJsonBody(c.req.raw);
    const updated = spellService.replaceCustomSpell(c.req.param("id"), parsePutSpellInput(body));
    return c.json(updated);
  });

  app.patch(`${API_BASE_PATH}/spells/:id`, async (c) => {
    const body = await getJsonBody(c.req.raw);
    const updated = spellService.patchCustomSpell(c.req.param("id"), parsePatchSpellInput(body));
    return c.json(updated);
  });

  app.delete(`${API_BASE_PATH}/spells/:id`, (c) => {
    spellService.deleteCustomSpell(c.req.param("id"));
    return c.body(null, 204);
  });

  app.get(`${API_BASE_PATH}/metadata`, (c) => c.json(metadataPayload));
  app.get(`${API_BASE_PATH}/openapi.json`, (c) => c.json(buildOpenApiDocument()));

  if (clientDistPath && fs.existsSync(clientDistPath)) {
    app.get("/assets/*", async (c) => {
      const assetPath = path.join(clientDistPath, c.req.path);
      if (!fs.existsSync(assetPath)) {
        return c.notFound();
      }

      return readStaticFile(assetPath);
    });

    app.get("*", async (c) => {
      if (c.req.path.startsWith(API_BASE_PATH)) {
        return c.notFound();
      }

      const requestPath = c.req.path === "/" ? "/index.html" : c.req.path;
      const filePath = path.join(clientDistPath, requestPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return readStaticFile(filePath);
      }

      return readStaticFile(path.join(clientDistPath, "index.html"));
    });
  }

  return app;
};
