export class APIError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "APIError";
    this.status = status;
  }
}

export function isUnauthorizedError(error: unknown): error is APIError {
  return error instanceof APIError && error.status === 401;
}

export async function request<T>(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  const isFormDataBody = typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (!isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    credentials: "include",
    headers,
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new APIError(response.status, body?.error ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
