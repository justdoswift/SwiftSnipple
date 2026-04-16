import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import AdminSnippetEditor from "../../pages/admin/AdminSnippetEditor";
import AdminSnippets from "../../pages/admin/AdminSnippets";
import { getSnippets } from "../../services/snippets";
import { Snippet } from "../../types";
import AdminLayout from "./AdminLayout";

vi.mock("../../services/snippets", () => ({
  createSnippet: vi.fn(),
  deleteSnippet: vi.fn(),
  getSnippetById: vi.fn(),
  getSnippets: vi.fn(),
  publishSnippet: vi.fn(),
  unpublishSnippet: vi.fn(),
  updateSnippet: vi.fn(),
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

function renderAdminRoute(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="snippets" element={<AdminSnippets />} />
          <Route path="snippets/new" element={<AdminSnippetEditor />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminLayout", () => {
  beforeEach(() => {
    mockedGetSnippets.mockReset();
    mockedGetSnippets.mockResolvedValue([baseSnippet]);
  });

  it("shows the unified dashboard command bar", async () => {
    renderAdminRoute("/admin");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    });

    const header = screen.getByRole("heading", { name: "Overview" }).closest("header");

    expect(screen.getByText("Snippet Workspace")).toBeInTheDocument();
    expect(header).not.toBeNull();
    expect(within(header!).getByRole("link", { name: "Start New Snippet" })).toBeInTheDocument();
    expect(within(header!).getByRole("link", { name: /View Front Site/i })).toBeInTheDocument();
    expect(screen.queryByText("Ship SwiftUI snippets with the same care you use to build them.")).not.toBeInTheDocument();
  });

  it("shows the unified snippets command bar", async () => {
    renderAdminRoute("/admin/snippets");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Snippet Library" })).toBeInTheDocument();
    });

    const header = screen.getByRole("heading", { name: "Snippet Library" }).closest("header");

    expect(header).not.toBeNull();
    expect(within(header!).getByRole("link", { name: "New Snippet" })).toBeInTheDocument();
    expect(within(header!).getByRole("link", { name: /View Front Site/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Search title or slug")).toBeInTheDocument();
  });

  it("shows the unified editor command bar", async () => {
    renderAdminRoute("/admin/snippets/new");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Back to snippets" })).toBeInTheDocument();
    });

    const header = screen.getByRole("button", { name: "Back to snippets" }).closest("header");

    expect(header).not.toBeNull();
    expect(screen.getByRole("tab", { name: "Narrative" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Builder" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Surface" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
    expect(within(header!).getByRole("link", { name: /View Front Site/i })).toBeInTheDocument();
  });
});
