import type {
  CreateSpellInput,
  PatchSpellInput,
  PutSpellInput,
  Spell,
  SpellListResponse,
} from "../../shared/schemas.js";

const API_BASE = "/api/v1";

type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
};

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: ApiErrorPayload["error"]["details"],
  ) {
    super(message);
  }
}

// Solid resource errors are typed `unknown`; this narrows without assuming every thrown value came from `request`.
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    throw new ApiClientError(
      response.status,
      payload?.error.code ?? "HTTP_ERROR",
      payload?.error.message ?? "Request failed.",
      payload?.error.details,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  getSpellList(params: URLSearchParams) {
    return request<SpellListResponse>(`/spells?${params.toString()}`);
  },
  getSpell(id: string) {
    return request<Spell>(`/spells/${id}`);
  },
  getMetadata() {
    return request<{
      schools: string[];
      classes: string[];
      levels: number[];
      sources: string[];
      listSources: string[];
    }>("/metadata");
  },
  createSpell(input: CreateSpellInput) {
    return request<Spell>("/spells", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  replaceSpell(id: string, input: PutSpellInput) {
    return request<Spell>(`/spells/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },
  patchSpell(id: string, input: PatchSpellInput) {
    return request<Spell>(`/spells/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  deleteSpell(id: string) {
    return request<void>(`/spells/${id}`, {
      method: "DELETE",
    });
  },
};
