import type { MemberSession } from "../types";
import { isUnauthorizedError, request } from "./api";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

type MemberAuthPayload = {
  email: string;
  password: string;
};

type SessionURLResponse = {
  url: string;
};

export function signupMember(payload: MemberAuthPayload) {
  return request<MemberSession>(`${API_BASE}/api/member/signup`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginMember(payload: MemberAuthPayload) {
  return request<MemberSession>(`${API_BASE}/api/member/login`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMemberSession() {
  try {
    return await request<MemberSession>(`${API_BASE}/api/member/session`);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return null;
    }

    throw error;
  }
}

export function logoutMember() {
  return request<void>(`${API_BASE}/api/member/logout`, {
    method: "POST",
  });
}

export function createCheckoutSession(priceId?: string) {
  return request<SessionURLResponse>(`${API_BASE}/api/member/checkout`, {
    method: "POST",
    body: priceId ? JSON.stringify({ price_id: priceId }) : undefined,
  });
}

export function createBillingPortalSession() {
  return request<SessionURLResponse>(`${API_BASE}/api/member/billing-portal`, {
    method: "POST",
  });
}
