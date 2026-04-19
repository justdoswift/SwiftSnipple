import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminSnippets from "./AdminSnippets";
import { getSnippets } from "../../services/snippets";
import { Snippet } from "../../types";

vi.mock("../../services/snippets", () => ({
  getSnippets: vi.fn(),
}));

const mockedGetSnippets = vi.mocked(getSnippets);

const baseSnippet: Snippet = {
  id: "snippet-1",
  title: "Prompt Studio",
  slug: "prompt-studio",
  excerpt: "An editor-ready snippet.",
  category: "Workflow",
  tags: ["Prompting"],
  coverImage: "https://example.com/cover.jpg",
  content: "# Prompt Studio",
  code: "Text(\"Prompt Studio\")",
  prompts: "Create an editor-ready snippet.",
  seoTitle: "Prompt Studio",
  seoDescription: "SEO copy",
  status: "Draft",
  updatedAt: "2026-04-09T12:00:00.000Z",
  publishedAt: null,
};

describe("AdminSnippets", () => {
  beforeEach(() => {
    mockedGetSnippets.mockReset();
  });

  it("shows the loading state before snippets resolve", () => {
    mockedGetSnippets.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <AdminSnippets />
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading snippet library...")).toBeInTheDocument();
  });

  it("shows a friendly empty state when the library has no snippets", async () => {
    mockedGetSnippets.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AdminSnippets />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("No snippets yet")).toBeInTheDocument();
    });
  });

  it("shows request errors explicitly", async () => {
    mockedGetSnippets.mockRejectedValue(new Error("backend offline"));

    render(
      <MemoryRouter>
        <AdminSnippets />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("backend offline")).toBeInTheDocument();
    });
  });

  it("renders snippet rows after loading", async () => {
    mockedGetSnippets.mockResolvedValue([baseSnippet]);

    render(
      <MemoryRouter>
        <AdminSnippets />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Prompt Studio")).toBeInTheDocument();
    });
  });

  it("filters snippet rows by search query", async () => {
    mockedGetSnippets.mockResolvedValue([
      baseSnippet,
      {
        ...baseSnippet,
        id: "snippet-2",
        title: "Surface Lab",
        slug: "surface-lab",
        category: "Animation",
      },
    ]);

    render(
      <MemoryRouter>
        <AdminSnippets />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Prompt Studio")).toBeInTheDocument();
      expect(screen.getByText("Surface Lab")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Search title or slug"), {
      target: { value: "surface" },
    });

    expect(screen.queryByText("Prompt Studio")).not.toBeInTheDocument();
    expect(screen.getByText("Surface Lab")).toBeInTheDocument();
  });

  it("uses the shared HeroUI dropdown classes for library filters", async () => {
    mockedGetSnippets.mockResolvedValue([baseSnippet]);

    render(
      <MemoryRouter>
        <AdminSnippets />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Prompt Studio")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Status: All" }));

    const menu = await screen.findByRole("menu");
    expect(menu).toHaveClass("dropdown__menu");
    expect(menu.closest(".dropdown__popover")).not.toBeNull();
    const selectedItem = within(menu).getByText("Status: All").closest(".menu-item");
    expect(selectedItem).not.toBeNull();
    expect(selectedItem?.querySelector(".menu-item__indicator")).not.toBeNull();
  });
});
