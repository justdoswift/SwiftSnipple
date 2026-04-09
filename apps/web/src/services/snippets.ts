import { Snippet, SnippetPayload } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getSnippets() {
  return request<Snippet[]>("/api/snippets");
}

export function getSnippetById(id: string) {
  return request<Snippet>(`/api/snippets/${id}`);
}

export function getSnippetBySlug(slug: string) {
  return request<Snippet>(`/api/snippets/slug/${slug}`);
}

export function createSnippet(payload: SnippetPayload) {
  return request<Snippet>("/api/admin/snippets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSnippet(id: string, payload: SnippetPayload) {
  return request<Snippet>(`/api/admin/snippets/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function publishSnippet(id: string) {
  return request<Snippet>(`/api/admin/snippets/${id}/publish`, {
    method: "POST",
  });
}

export function unpublishSnippet(id: string) {
  return request<Snippet>(`/api/admin/snippets/${id}/unpublish`, {
    method: "POST",
  });
}

export async function deleteSnippet(id: string) {
  const response = await fetch(`${API_BASE}/api/admin/snippets/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }
}
