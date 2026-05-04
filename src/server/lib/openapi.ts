import { API_BASE_PATH, LEVEL_VALUES, SPELL_CLASSES, SPELL_SCHOOLS } from "../../shared/constants.js";

export const buildOpenApiDocument = () => ({
  openapi: "3.1.0",
  info: {
    title: "Library of Netheril API",
    version: "1.0.0",
  },
  paths: {
    [`${API_BASE_PATH}/health`]: {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "Service health",
          },
        },
      },
    },
    [`${API_BASE_PATH}/spells`]: {
      get: {
        summary: "List spells",
      },
      post: {
        summary: "Create custom spell",
      },
    },
    [`${API_BASE_PATH}/spells/{id}`]: {
      get: {
        summary: "Get spell by id",
      },
      put: {
        summary: "Replace custom spell",
      },
      patch: {
        summary: "Patch custom spell",
      },
      delete: {
        summary: "Delete custom spell",
      },
    },
    [`${API_BASE_PATH}/metadata`]: {
      get: {
        summary: "Get metadata",
      },
    },
    [`${API_BASE_PATH}/openapi.json`]: {
      get: {
        summary: "OpenAPI document",
      },
    },
  },
  components: {
    schemas: {
      SpellSchool: {
        type: "string",
        enum: SPELL_SCHOOLS,
      },
      SpellClass: {
        type: "string",
        enum: SPELL_CLASSES,
      },
      SpellLevel: {
        type: "integer",
        enum: LEVEL_VALUES,
      },
      ApiError: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    field: { type: "string" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});
