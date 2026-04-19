import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";
import { getSnippets } from "../services/snippets";
import { createSnippet } from "../test/factories";

vi.mock("../services/snippets", () => ({
  getSnippets: vi.fn(),
}));

const mockedGetSnippets = vi.mocked(getSnippets);

const publishedSnippet = createSnippet({
  title: "Glass Navigation",
  slug: "glass-navigation",
  excerpt: "A published snippet for the homepage.",
  content: "# Title",
});

describe("Home", () => {
  beforeEach(() => {
    mockedGetSnippets.mockReset();
  });

  it("renders published snippets from the API", async () => {
    mockedGetSnippets.mockResolvedValue([
      publishedSnippet,
      createSnippet({
        id: "snippet-2",
        title: "Draft Entry",
        slug: "draft-entry",
        excerpt: "A hidden draft.",
        status: "Draft",
        publishedAt: null,
      }),
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

  it("preserves the excerpt slot even when a published snippet has no excerpt", async () => {
    mockedGetSnippets.mockResolvedValue([
      publishedSnippet,
      createSnippet({
        id: "snippet-2",
        title: "Empty Excerpt",
        slug: "empty-excerpt",
        excerpt: "",
      }),
    ]);

    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Empty Excerpt").length).toBeGreaterThan(0);
    });

    expect(container.querySelectorAll(".public-snippet-card-copy-slot")).toHaveLength(2);
  });
});
