import { Snippet, SnippetPayload } from "../types";
import { request } from "./api";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

type CoverImageUploadResponse = {
  url: string;
};

export function getSnippets() {
  return request<Snippet[]>(`${API_BASE}/api/snippets`);
}

export function getSnippetById(id: string) {
  return request<Snippet>(`${API_BASE}/api/snippets/${id}`);
}

export function getSnippetBySlug(slug: string) {
  return request<Snippet>(`${API_BASE}/api/snippets/slug/${slug}`);
}

export function createSnippet(payload: SnippetPayload) {
  return request<Snippet>(`${API_BASE}/api/admin/snippets`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSnippet(id: string, payload: SnippetPayload) {
  return request<Snippet>(`${API_BASE}/api/admin/snippets/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function publishSnippet(id: string) {
  return request<Snippet>(`${API_BASE}/api/admin/snippets/${id}/publish`, {
    method: "POST",
  });
}

export function unpublishSnippet(id: string) {
  return request<Snippet>(`${API_BASE}/api/admin/snippets/${id}/unpublish`, {
    method: "POST",
  });
}

export function deleteSnippet(id: string) {
  return request<void>(`${API_BASE}/api/admin/snippets/${id}`, {
    method: "DELETE",
  });
}

export function uploadCoverImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return request<CoverImageUploadResponse>(`${API_BASE}/api/admin/uploads/cover`, {
    method: "POST",
    body: formData,
  });
}
