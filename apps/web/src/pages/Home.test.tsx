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
      createSnippet({
        ...publishedSnippet,
        publishedAt: "2026-04-09T12:00:00.000Z",
      }),
      createSnippet({
        id: "snippet-3",
        title: "Newest Entry",
        slug: "newest-entry",
        excerpt: "The newest published snippet.",
        publishedAt: "2026-04-12T12:00:00.000Z",
      }),
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

    expect(screen.getByRole("heading", { name: "Exceptional Builds. Native SwiftUI." })).toBeInTheDocument();
    expect(screen.getByTestId("home-hero")).toHaveClass("min-h-screen");
    expect(screen.getByText("Accessing Data Stores...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("home-lead-card")).toHaveTextContent("Newest Entry");
    });

    expect(screen.getByTestId("home-lead-card")).toHaveAttribute("href", "/snippets/newest-entry");
    expect(screen.getByTestId("home-lead-card-media").querySelector(".snippet-cover-frame")).not.toBeNull();

    expect(screen.getByTestId("home-grid")).toHaveTextContent("Glass Navigation");
    expect(screen.queryByText("Draft Entry")).not.toBeInTheDocument();
  });

  it("preserves the excerpt slot even when a published snippet has no excerpt", async () => {
    mockedGetSnippets.mockResolvedValue([
      createSnippet({
        ...publishedSnippet,
        publishedAt: "2026-04-10T12:00:00.000Z",
      }),
      createSnippet({
        id: "snippet-2",
        title: "Empty Excerpt",
        slug: "empty-excerpt",
        excerpt: "",
        publishedAt: "2026-04-09T12:00:00.000Z",
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

    expect(container.querySelectorAll(".public-home-grid-card-copy-slot")).toHaveLength(1);
  });
});
