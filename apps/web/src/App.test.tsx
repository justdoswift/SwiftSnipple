import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { getAdminSession, logoutAdmin } from "./services/admin-auth";
import { getMemberSession, loginMember, logoutMember } from "./services/member-auth";
import { getAdminSnippets, getSnippets } from "./services/snippets";
import { createMemberSession, createSnippet } from "./test/factories";

vi.mock("./services/snippets", () => ({
  getAdminSnippets: vi.fn(),
  getSnippets: vi.fn(),
  getSnippetBySlug: vi.fn(),
}));

vi.mock("./services/admin-auth", () => ({
  getAdminSession: vi.fn(),
  logoutAdmin: vi.fn(),
}));

vi.mock("./services/member-auth", () => ({
  getMemberSession: vi.fn(),
  loginMember: vi.fn(),
  logoutMember: vi.fn(),
  signupMember: vi.fn(),
}));

const mockedGetSnippets = vi.mocked(getSnippets);
const mockedGetAdminSnippets = vi.mocked(getAdminSnippets);
const mockedGetAdminSession = vi.mocked(getAdminSession);
const mockedLogoutAdmin = vi.mocked(logoutAdmin);
const mockedGetMemberSession = vi.mocked(getMemberSession);
const mockedLoginMember = vi.mocked(loginMember);
const mockedLogoutMember = vi.mocked(logoutMember);

const publishedSnippet = createSnippet({
  title: "Glass Navigation",
  slug: "glass-navigation",
  excerpt: "A published snippet for the homepage.",
  content: "# Title",
});

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderAppAt(pathname: string) {
  window.history.pushState({}, "", pathname);
  return render(<App />);
}

describe("App public theme", () => {
  beforeEach(() => {
    mockedGetSnippets.mockReset();
    mockedGetSnippets.mockResolvedValue([publishedSnippet]);
    mockedGetAdminSnippets.mockReset();
    mockedGetAdminSnippets.mockResolvedValue([publishedSnippet]);
    mockedGetAdminSession.mockReset();
    mockedGetAdminSession.mockResolvedValue(null);
    mockedLogoutAdmin.mockReset();
    mockedLogoutAdmin.mockResolvedValue(undefined);
    mockedGetMemberSession.mockReset();
    mockedGetMemberSession.mockResolvedValue(null);
    mockedLoginMember.mockReset();
    mockedLoginMember.mockResolvedValue(createMemberSession());
    mockedLogoutMember.mockReset();
    mockedLogoutMember.mockResolvedValue(undefined);
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.scrollTo = vi.fn();
    mockMatchMedia(true);
  });

  it("defaults to dark mode and toggles the whole public shell", async () => {
    renderAppAt("/");

    await waitFor(() => {
      expect(screen.getByText("Curated SwiftUI builds, broken down clearly")).toBeInTheDocument();
    });

    const shell = screen.getByTestId("public-theme-root");
    expect(shell).toHaveAttribute("data-theme", "dark");

    fireEvent.click(screen.getByRole("button", { name: "Switch to light site mode" }));

    expect(shell).toHaveAttribute("data-theme", "light");
    expect(window.localStorage.getItem("just-do-swift-public-theme")).toBe("light");
  });

  it("restores the persisted public theme on load", async () => {
    window.localStorage.setItem("just-do-swift-public-theme", "light");

    renderAppAt("/");

    await waitFor(() => {
      expect(screen.getByText("Curated SwiftUI builds, broken down clearly")).toBeInTheDocument();
    });

    expect(screen.getByTestId("public-theme-root")).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Switch to dark site mode" })).toBeInTheDocument();
  });

  it("shows the centered public fallback without a surface card while a route is loading", () => {
    mockedGetSnippets.mockImplementation(() => new Promise(() => undefined));

    renderAppAt("/");

    const fallback = screen.getByTestId("public-route-fallback");
    expect(fallback).toHaveAttribute("aria-label", "Loading");
    expect(fallback.querySelector(".public-surface")).toBeNull();
  });

  it("redirects unauthenticated admin visits to the creator login page", async () => {
    renderAppAt("/admin");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Creator Log In" })).toBeInTheDocument();
    });

    expect(screen.queryByText("Entries")).not.toBeInTheDocument();
  });

  it("allows authenticated creators into the admin workspace", async () => {
    mockedGetAdminSession.mockResolvedValue({
      email: "creator@example.com",
      provider: "email",
      createdAt: "2026-04-18T00:00:00.000Z",
    });

    renderAppAt("/admin");

    await waitFor(() => {
      expect(screen.getByText("Entries")).toBeInTheDocument();
    });

    expect(screen.getByTestId("admin-theme-root")).toHaveAttribute("data-theme", "dark");
  });

  it("redirects authenticated creators away from admin login", async () => {
    mockedGetAdminSession.mockResolvedValue({
      email: "creator@example.com",
      provider: "email",
      createdAt: "2026-04-18T00:00:00.000Z",
    });

    renderAppAt("/admin/login");

    await waitFor(() => {
      expect(screen.getByText("Entries")).toBeInTheDocument();
    });
  });

  it("returns creators to the admin login page after sign out", async () => {
    mockedGetAdminSession.mockResolvedValue({
      email: "creator@example.com",
      provider: "email",
      createdAt: "2026-04-18T00:00:00.000Z",
    });

    renderAppAt("/admin");

    await waitFor(() => {
      expect(screen.getByText("Entries")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Creator Log In" })).toBeInTheDocument();
    });
    expect(mockedLogoutAdmin).toHaveBeenCalled();
  });

  it("redirects legacy locale-prefixed admin routes to the unprefixed workspace", async () => {
    mockedGetAdminSession.mockResolvedValue({
      email: "creator@example.com",
      provider: "email",
      createdAt: "2026-04-18T00:00:00.000Z",
    });

    renderAppAt("/en/admin");

    await waitFor(() => {
      expect(screen.getByText("Entries")).toBeInTheDocument();
    });

    expect(window.location.pathname).toBe("/admin");
  });

  it("keeps the login route in sync with the selected public theme", async () => {
    renderAppAt("/");

    await waitFor(() => {
      expect(screen.getByText("Curated SwiftUI builds, broken down clearly")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Switch to light site mode" }));
    fireEvent.click(screen.getByRole("link", { name: "Log in" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
    });

    expect(screen.getByTestId("public-theme-root")).toHaveAttribute("data-theme", "light");
  });

  it("routes a simulated login into the member center", async () => {
    renderAppAt("/login");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "builder@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret12" } });
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(screen.getByText("builder@example.com")).toBeInTheDocument();
    });
    expect(mockedLoginMember).toHaveBeenCalledWith({
      email: "builder@example.com",
      password: "secret12",
    });
  });
});
