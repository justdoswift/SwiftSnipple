export type MockAuthProvider = "email" | "google" | "github";

export interface MockAuthSession {
  email: string;
  provider: MockAuthProvider;
  createdAt: string;
}

const MOCK_AUTH_STORAGE_KEY = "just-do-swift-mock-auth";

function readFromStorage(storage: Storage | undefined): MockAuthSession | null {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(MOCK_AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<MockAuthSession>;
    if (
      typeof parsed.email !== "string" ||
      !["email", "google", "github"].includes(parsed.provider ?? "") ||
      typeof parsed.createdAt !== "string"
    ) {
      return null;
    }

    return parsed as MockAuthSession;
  } catch {
    return null;
  }
}

export function readStoredMockAuth(): MockAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  return readFromStorage(window.localStorage) ?? readFromStorage(window.sessionStorage);
}

export function writeStoredMockAuth(session: MockAuthSession, remember: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(session);
  window.localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(MOCK_AUTH_STORAGE_KEY);

  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(MOCK_AUTH_STORAGE_KEY, serialized);
}

export function clearStoredMockAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
}
