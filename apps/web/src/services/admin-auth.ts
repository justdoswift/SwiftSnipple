import type { AdminAuthSession } from "../lib/admin-auth";
import { isUnauthorizedError, request } from "./api";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export function loginAdmin(payload: { email: string; password: string }) {
  return request<AdminAuthSession>(`${API_BASE}/api/admin/login`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminSession() {
  try {
    return await request<AdminAuthSession>(`${API_BASE}/api/admin/session`);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return null;
    }

    throw error;
  }
}

export function logoutAdmin() {
  return request<void>(`${API_BASE}/api/admin/logout`, {
    method: "POST",
  });
}
