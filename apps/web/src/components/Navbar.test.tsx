import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar";
import type { PublicTheme } from "../lib/public-theme";
import type { MockAuthSession } from "../lib/mock-auth";

function renderNavbar(
  theme: PublicTheme = "dark",
  onToggleTheme = vi.fn(),
  authSession: MockAuthSession | null = null,
) {
  return render(
    <MemoryRouter>
      <Navbar theme={theme} onToggleTheme={onToggleTheme} authSession={authSession} />
    </MemoryRouter>,
  );
}

describe("Navbar", () => {
  it("renders the hero-style brand and actions", () => {
    renderNavbar();

    expect(screen.getByRole("link", { name: "Just Do Swift homepage" })).toBeInTheDocument();
    expect(screen.getByText("Just Do Swift")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search snippets" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to light site mode" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Select language" })).toHaveClass("public-nav-locale-select");
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "中文" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/en/login");
    expect(screen.getByRole("link", { name: "Log in" })).toHaveClass("public-nav-auth-button");
  });

  it("calls the parent toggle handler and reflects the provided theme", () => {
    const onToggleTheme = vi.fn();
    renderNavbar("dark", onToggleTheme);

    const shell = screen.getByTestId("public-navbar-shell").closest("nav");
    const toggle = screen.getByRole("button", { name: "Switch to light site mode" });

    expect(shell).toHaveAttribute("data-theme", "dark");

    fireEvent.click(toggle);

    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it("renders the current light theme state", () => {
    renderNavbar("light");
    expect(screen.getByTestId("public-navbar-shell").closest("nav")).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Switch to dark site mode" })).toBeInTheDocument();
  });

  it("switches the auth action to the account page when a session exists", () => {
    renderNavbar("dark", vi.fn(), {
      email: "builder@example.com",
      provider: "email",
      createdAt: "2026-04-18T00:00:00.000Z",
    });

    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute("href", "/en/account");
    expect(screen.getByRole("link", { name: "Account" })).toHaveClass("public-nav-auth-button");
  });
});
