import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import AdminSnippetEditor from "../../pages/admin/AdminSnippetEditor";
import AdminSnippets from "../../pages/admin/AdminSnippets";
import { getSnippets } from "../../services/snippets";
import { Snippet } from "../../types";
import AdminLayout from "./AdminLayout";
import type { AdminAuthSession } from "../../lib/admin-auth";

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

const adminAuthSession: AdminAuthSession = {
  email: "creator@example.com",
  provider: "email",
  createdAt: "2026-04-18T00:00:00.000Z",
};

function renderAdminRoute(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/en/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
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
    renderAdminRoute("/en/admin");

    await waitFor(() => {
      expect(screen.getByLabelText("Search title or slug")).toBeInTheDocument();
    });

    const header = screen.getByTestId("admin-navbar-shell").closest("header");

    expect(screen.getByRole("link", { name: "Just Do Swift admin" })).toBeInTheDocument();
    expect(header).not.toBeNull();
    expect(within(header!).getByRole("link", { name: "New" })).toHaveAttribute("href", "/en/admin/snippets/new");
    expect(within(header!).getByRole("link", { name: "New" })).toHaveClass("admin-create-button");
    expect(within(header!).getByRole("button", { name: "Log out" })).toHaveClass("admin-auth-button");
    expect(within(header!).getByRole("button", { name: "Select language" })).toBeInTheDocument();
    expect(within(header!).getByRole("link", { name: /View Front Site/i })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Admin sections" })).not.toBeInTheDocument();
    expect(screen.queryByText("Ship SwiftUI snippets with the same care you use to build them.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Search title or slug")).toBeInTheDocument();
    expect(screen.getByText("Prompt Studio")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Overview" })).not.toBeInTheDocument();
    expect(screen.queryByText("Recent Activity")).not.toBeInTheDocument();
    expect(screen.queryByText("Latest edits and launches")).not.toBeInTheDocument();
    expect(screen.queryByText("Status Mix")).not.toBeInTheDocument();
    expect(screen.queryByText("Next Up")).not.toBeInTheDocument();
    expect(screen.queryByText("Scheduled Release")).not.toBeInTheDocument();
    expect(screen.getByTestId("admin-content-shell")).not.toHaveClass("md:pl-24");
    expect(screen.getByTestId("admin-content-shell")).not.toHaveClass("xl:pl-28");
    expect(screen.getByTestId("admin-page-width-shell")).not.toHaveClass("admin-editor-shell-width");
  });

  it("shows the unified snippets command bar", async () => {
    renderAdminRoute("/en/admin/snippets");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Snippet Library" })).toBeInTheDocument();
    });

    const header = screen.getByTestId("admin-navbar-shell").closest("header");

    expect(header).not.toBeNull();
    expect(within(header!).getByRole("link", { name: "New" })).toHaveAttribute("href", "/en/admin/snippets/new");
    expect(within(header!).getByRole("link", { name: "New" })).toHaveClass("admin-create-button");
    expect(within(header!).getByRole("button", { name: "Log out" })).toHaveClass("admin-auth-button");
    expect(within(header!).getByRole("link", { name: /View Front Site/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Admin sections" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /snippets/i })).toBeInTheDocument();
    expect(screen.getByTestId("admin-content-shell")).toHaveClass("md:pl-24");
    expect(screen.getByTestId("admin-content-shell")).toHaveClass("xl:pl-28");
    expect(screen.getByTestId("admin-page-width-shell")).not.toHaveClass("admin-editor-shell-width");
    expect(screen.getByLabelText("Search title or slug")).toBeInTheDocument();
  });

  it("shows the unified editor command bar", async () => {
    renderAdminRoute("/en/admin/snippets/new");

    await waitFor(() => {
      expect(screen.getByLabelText("Snippet Title")).toBeInTheDocument();
    });

    const header = screen.getByTestId("admin-navbar-shell").closest("header");

    expect(header).not.toBeNull();
    expect(within(header!).getByRole("link", { name: "Just Do Swift admin" })).toBeInTheDocument();
    expect(within(header!).getByRole("button", { name: "Log out" })).toHaveClass("admin-auth-button");
    expect(screen.queryByRole("navigation", { name: "Admin sections" })).not.toBeInTheDocument();
    expect(screen.getByTestId("admin-content-shell")).toHaveClass("md:px-24");
    expect(screen.getByTestId("admin-content-shell")).toHaveClass("xl:px-28");
    expect(screen.getByTestId("admin-content-shell")).not.toHaveClass("md:pl-24");
    expect(screen.getByTestId("admin-content-shell")).not.toHaveClass("xl:pl-28");
    expect(screen.getByTestId("admin-page-width-shell")).toHaveClass("admin-editor-shell-width");
    expect(within(header!).queryByRole("button", { name: "Back to snippets" })).not.toBeInTheDocument();
    expect(within(header!).queryByText("New entry")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Narrative" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Code" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Prompt" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Surface" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
    expect(within(header!).getByRole("link", { name: /View Front Site/i })).toBeInTheDocument();
  });
});
