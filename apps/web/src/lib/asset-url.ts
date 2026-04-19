const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export function resolveAssetUrl(url: string) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return "";
  }

  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith("/api/uploads/")) {
    return `${API_BASE}${trimmedUrl}`;
  }

  if (trimmedUrl.startsWith("/uploads/")) {
    return `${API_BASE}/api${trimmedUrl}`;
  }

  if (trimmedUrl.startsWith("/")) {
    return `${API_BASE}${trimmedUrl}`;
  }

  return trimmedUrl;
}
