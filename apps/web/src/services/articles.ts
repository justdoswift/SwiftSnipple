import { Article, ArticlePayload } from "../types";

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

export function getArticles() {
  return request<Article[]>("/api/articles");
}

export function getArticleById(id: string) {
  return request<Article>(`/api/articles/${id}`);
}

export function getArticleBySlug(slug: string) {
  return request<Article>(`/api/articles/slug/${slug}`);
}

export function createArticle(payload: ArticlePayload) {
  return request<Article>("/api/admin/articles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateArticle(id: string, payload: ArticlePayload) {
  return request<Article>(`/api/admin/articles/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function publishArticle(id: string) {
  return request<Article>(`/api/admin/articles/${id}/publish`, {
    method: "POST",
  });
}

export function unpublishArticle(id: string) {
  return request<Article>(`/api/admin/articles/${id}/unpublish`, {
    method: "POST",
  });
}

export async function deleteArticle(id: string) {
  const response = await fetch(`${API_BASE}/api/admin/articles/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }
}
