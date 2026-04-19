export type AdminAuthProvider = "email";

export interface AdminAuthSession {
  email: string;
  provider: AdminAuthProvider;
  createdAt: string;
}
