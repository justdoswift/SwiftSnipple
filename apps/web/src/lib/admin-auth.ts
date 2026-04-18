export type AdminAuthProvider = "email" | "google" | "github";

export interface AdminAuthSession {
  email: string;
  provider: AdminAuthProvider;
  createdAt: string;
}

export const ADMIN_AUTH_STORAGE_KEY = "just-do-swift-admin-mock-auth";

export function readStoredAdminAuth(): AdminAuthSession | null {
  const rawValue = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AdminAuthSession;
  } catch {
    window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    return null;
  }
}

export function writeStoredAdminAuth(session: AdminAuthSession) {
  window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAdminAuth() {
  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
}
