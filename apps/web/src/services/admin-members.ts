import type { AdminMember } from "../types";
import { request } from "./api";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export function getAdminMembers() {
  return request<AdminMember[]>(`${API_BASE}/api/admin/members`);
}
