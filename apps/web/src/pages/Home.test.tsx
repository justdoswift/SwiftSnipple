import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";
import { getArticles } from "../services/articles";
import { Article } from "../types";

vi.mock("../services/articles", () => ({
  getArticles: vi.fn(),
}));

const mockedGetArticles = vi.mocked(getArticles);

const publishedArticle: Article = {
  id: "article-1",
  title: "Glass Navigation",
  slug: "glass-navigation",
  excerpt: "A published article for the homepage.",
  category: "Navigation",
  tags: ["SwiftUI"],
  coverImage: "https://example.com/cover.jpg",
  content: "# Title",
  seoTitle: "Glass Navigation",
  seoDescription: "SEO copy",
  status: "Published",
  updatedAt: "2026-04-09T12:00:00.000Z",
  publishedAt: "2026-04-09T12:00:00.000Z",
};

describe("Home", () => {
  beforeEach(() => {
    mockedGetArticles.mockReset();
  });

  it("renders published articles from the API", async () => {
    mockedGetArticles.mockResolvedValue([
      publishedArticle,
      { ...publishedArticle, id: "article-2", slug: "draft-entry", title: "Draft Entry", status: "Draft" },
    ]);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading published entries...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Glass Navigation")).toHaveLength(2);
    });

    expect(screen.queryByText("Draft Entry")).not.toBeInTheDocument();
  });
});
