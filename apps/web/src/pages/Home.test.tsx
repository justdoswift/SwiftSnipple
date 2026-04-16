import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";
import { getSnippets } from "../services/snippets";
import { Snippet } from "../types";

vi.mock("../services/snippets", () => ({
  getSnippets: vi.fn(),
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

describe("Home", () => {
  beforeEach(() => {
    mockedGetSnippets.mockReset();
  });

  it("renders published snippets from the API", async () => {
    mockedGetSnippets.mockResolvedValue([
      publishedSnippet,
      { ...publishedSnippet, id: "snippet-2", slug: "draft-entry", title: "Draft Entry", status: "Draft" },
    ]);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(screen.getByText("Accessing Data Stores...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Glass Navigation")).toHaveLength(2);
    });

    expect(screen.queryByText("Draft Entry")).not.toBeInTheDocument();
  });
});
