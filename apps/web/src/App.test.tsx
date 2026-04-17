import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { getSnippets } from "./services/snippets";
import type { Snippet } from "./types";

vi.mock("./services/snippets", () => ({
  getSnippets: vi.fn(),
  getSnippetBySlug: vi.fn(),
}));

const mockedGetSnippets = vi.mocked(getSnippets);

const publishedSnippet: Snippet = {
  id: "snippet-1",
  title: "Glass Navigation",
  slug: "glass-navigation",
  excerpt: "A published snippet for the homepage.",
  category: "Navigation",
  tags: ["SwiftUI"],
  coverImage: "https://example.com/cover.jpg",
  content: "# Title",
  code: "Text(\"Hello\")",
  prompts: "Build a polished navigation snippet.",
  seoTitle: "Glass Navigation",
  seoDescription: "SEO copy",
  status: "Published",
  updatedAt: "2026-04-09T12:00:00.000Z",
  publishedAt: "2026-04-09T12:00:00.000Z",
};

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
    window.localStorage.clear();
    window.scrollTo = vi.fn();
    mockMatchMedia(true);
  });

  it("defaults to dark mode and toggles the whole public shell", async () => {
    renderAppAt("/");

    await waitFor(() => {
      expect(screen.getByText("Exceptional Builds. Native SwiftUI.")).toBeInTheDocument();
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
      expect(screen.getByText("Exceptional Builds. Native SwiftUI.")).toBeInTheDocument();
    });

    expect(screen.getByTestId("public-theme-root")).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Switch to dark site mode" })).toBeInTheDocument();
  });
});
