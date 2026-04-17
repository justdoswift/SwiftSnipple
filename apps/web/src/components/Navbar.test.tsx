import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar";
import type { PublicTheme } from "../lib/public-theme";

function renderNavbar(theme: PublicTheme = "dark", onToggleTheme = vi.fn()) {
  return render(
    <MemoryRouter>
      <Navbar theme={theme} onToggleTheme={onToggleTheme} />
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
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/admin");
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
});
