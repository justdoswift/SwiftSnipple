import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import Navbar from "./Navbar";

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
}

describe("Navbar", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders the hero-style brand and actions", () => {
    renderNavbar();

    expect(screen.getByRole("link", { name: "Just Do Swift homepage" })).toBeInTheDocument();
    expect(screen.getByText("Just Do Swift")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search snippets" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to light header mode" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/admin");
  });

  it("toggles the header theme and persists it", () => {
    renderNavbar();

    const shell = screen.getByTestId("public-navbar-shell").closest("nav");
    const toggle = screen.getByRole("button", { name: "Switch to light header mode" });

    expect(shell).toHaveAttribute("data-theme", "dark");

    fireEvent.click(toggle);

    expect(shell).toHaveAttribute("data-theme", "light");
    expect(window.localStorage.getItem("just-do-swift-header-theme")).toBe("light");
    expect(screen.getByRole("button", { name: "Switch to dark header mode" })).toBeInTheDocument();
  });

  it("restores the persisted theme on rerender", () => {
    window.localStorage.setItem("just-do-swift-header-theme", "light");

    renderNavbar();

    expect(screen.getByTestId("public-navbar-shell").closest("nav")).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Switch to dark header mode" })).toBeInTheDocument();
  });
});
