import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminArticles from "./AdminArticles";
import { getArticles } from "../../services/articles";
import { Article } from "../../types";

vi.mock("../../services/articles", () => ({
  getArticles: vi.fn(),
}));

const mockedGetArticles = vi.mocked(getArticles);

const baseArticle: Article = {
  id: "article-1",
  title: "Prompt Studio",
  slug: "prompt-studio",
  excerpt: "An editor-ready article.",
  category: "Workflow",
  tags: ["Prompting"],
  coverImage: "https://example.com/cover.jpg",
  content: "# Prompt Studio",
  seoTitle: "Prompt Studio",
  seoDescription: "SEO copy",
  status: "Draft",
  updatedAt: "2026-04-09T12:00:00.000Z",
  publishedAt: null,
};

describe("AdminArticles", () => {
  beforeEach(() => {
    mockedGetArticles.mockReset();
  });

  it("shows the loading state before articles resolve", () => {
    mockedGetArticles.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <AdminArticles />
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading article index...")).toBeInTheDocument();
  });

  it("shows a friendly empty state when the archive has no articles", async () => {
    mockedGetArticles.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AdminArticles />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("No articles yet")).toBeInTheDocument();
    });
  });

  it("shows request errors explicitly", async () => {
    mockedGetArticles.mockRejectedValue(new Error("backend offline"));

    render(
      <MemoryRouter>
        <AdminArticles />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("backend offline")).toBeInTheDocument();
    });
  });

  it("renders article rows after loading", async () => {
    mockedGetArticles.mockResolvedValue([baseArticle]);

    render(
      <MemoryRouter>
        <AdminArticles />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Prompt Studio")).toBeInTheDocument();
    });
  });
});
