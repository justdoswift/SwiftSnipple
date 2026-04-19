import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminSnippets from "./AdminSnippets";
import { getAdminSnippets } from "../../services/snippets";
import { createSnippet } from "../../test/factories";

vi.mock("../../services/snippets", () => ({
  getAdminSnippets: vi.fn(),
}));

const mockedGetAdminSnippets = vi.mocked(getAdminSnippets);

const baseSnippet = createSnippet({
  title: "Prompt Studio",
  slug: "prompt-studio",
  excerpt: "An editor-ready snippet.",
  category: "Workflow",
  tags: ["Prompting"],
  content: "# Prompt Studio",
  code: 'Text("Prompt Studio")',
  prompts: "Create an editor-ready snippet.",
  status: "Draft",
  publishedAt: null,
});

describe("AdminSnippets", () => {
  beforeEach(() => {
    mockedGetAdminSnippets.mockReset();
  });

  it("shows the loading state before snippets resolve", () => {
    mockedGetAdminSnippets.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <AdminSnippets />
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading snippet library...")).toBeInTheDocument();
  });

  it("shows a friendly empty state when the library has no snippets", async () => {
    mockedGetAdminSnippets.mockResolvedValue([]);

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
    mockedGetAdminSnippets.mockRejectedValue(new Error("backend offline"));

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
    mockedGetAdminSnippets.mockResolvedValue([baseSnippet]);

    render(
      <MemoryRouter>
        <AdminSnippets />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Prompt Studio")).toBeInTheDocument();
    });
  });

  it("keeps snippet dates on the dedicated meta text class instead of admin-copy-muted", async () => {
    mockedGetAdminSnippets.mockResolvedValue([baseSnippet]);

    render(
      <MemoryRouter>
        <AdminSnippets />
      </MemoryRouter>,
    );

    const updatedLabel = await screen.findByText((content) => content.includes("Updated") && content.includes("Apr 9, 2026"));
    const metaBlock = updatedLabel.closest(".admin-snippet-meta");

    expect(metaBlock).not.toBeNull();
    expect(metaBlock).not.toHaveClass("admin-copy-muted");
  });

  it("filters snippet rows by search query", async () => {
    mockedGetAdminSnippets.mockResolvedValue([
      baseSnippet,
      createSnippet({
        id: "snippet-2",
        title: "Surface Lab",
        slug: "surface-lab",
        excerpt: "Animation-focused snippet.",
        category: "Animation",
        status: "Draft",
        publishedAt: null,
      }),
    ]);

    render(
      <MemoryRouter>
        <AdminSnippets />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Prompt Studio").length).toBeGreaterThan(0);
      expect(screen.getByText("Surface Lab")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Search title or slug"), {
      target: { value: "surface" },
    });

    expect(screen.queryByText("Prompt Studio")).not.toBeInTheDocument();
    expect(screen.getByText("Surface Lab")).toBeInTheDocument();
  });

  it("uses the shared HeroUI dropdown classes for library filters", async () => {
    mockedGetAdminSnippets.mockResolvedValue([baseSnippet]);

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
    expect(within(menu).getByText("Status: Draft")).toBeInTheDocument();
    expect(within(menu).getByText("Status: Published")).toBeInTheDocument();
    expect(within(menu).queryByText("Status: In Review")).not.toBeInTheDocument();
    expect(within(menu).queryByText("Status: Scheduled")).not.toBeInTheDocument();
  });
});
