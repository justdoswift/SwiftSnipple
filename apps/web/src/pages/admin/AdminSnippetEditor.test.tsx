import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminSnippetEditor from "./AdminSnippetEditor";
import { getSnippetById } from "../../services/snippets";

vi.mock("../../services/snippets", () => ({
  createSnippet: vi.fn(),
  deleteSnippet: vi.fn(),
  getSnippetById: vi.fn(),
  publishSnippet: vi.fn(),
  unpublishSnippet: vi.fn(),
  updateSnippet: vi.fn(),
}));

const mockedGetSnippetById = vi.mocked(getSnippetById);

describe("AdminSnippetEditor", () => {
  it("renders the new snippet editor route without inline preview", () => {
    mockedGetSnippetById.mockReset();

    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Snippet Title")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to snippets" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Narrative" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Builder" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Surface" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view front site/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Implementation notes")).toBeInTheDocument();
    expect(screen.queryByText("Live preview")).not.toBeInTheDocument();
    expect(screen.queryByText("Shared with public view")).not.toBeInTheDocument();
  });

  it("renders the new snippet editor route", () => {
    mockedGetSnippetById.mockReset();

    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Snippet Title")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to snippets" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Narrative" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Builder" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Surface" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view front site/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Implementation notes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByText("Save this draft first to open the public preview at /snippets/untitled.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
  });

  it("opens preview mode with device controls for saved snippets", async () => {
    mockedGetSnippetById.mockReset();
    mockedGetSnippetById.mockResolvedValue({
      id: "snippet-1",
      title: "Smooth Feedback Loops",
      slug: "smooth-feedback-loops",
      excerpt: "A polished snippet preview.",
      category: "Workflow",
      tags: ["SwiftUI"],
      coverImage: "https://example.com/cover.jpg",
      content: "# Smooth Feedback Loops",
      code: "Text(\"Preview\")",
      prompts: "Build a previewable snippet.",
      seoTitle: "Smooth Feedback Loops",
      seoDescription: "SEO copy",
      status: "Draft",
      updatedAt: "2026-04-09T12:00:00.000Z",
      publishedAt: null,
    });

    render(
      <MemoryRouter initialEntries={["/admin/snippets/snippet-1"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="snippets/:id" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Snippet Title")).toHaveValue("Smooth Feedback Loops");
    });

    expect(screen.getByLabelText("Snippet Title")).toHaveValue("Smooth Feedback Loops");
    expect(screen.queryByRole("button", { name: "Back to snippets" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    await waitFor(() => {
      expect(screen.getByText("Preview Mode")).toBeInTheDocument();
    });

    expect(screen.getByRole("tab", { name: "Desktop" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Mobile" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("link", { name: "Open in tab" })).toHaveAttribute("href", "/snippets/smooth-feedback-loops");
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.getByTitle("Snippet public preview").closest("[data-preview-device]")).toHaveAttribute("data-preview-device", "desktop");

    fireEvent.click(screen.getByRole("tab", { name: "Mobile" }));

    await waitFor(() => {
      expect(screen.getByTitle("Snippet public preview").closest("[data-preview-device]")).toHaveAttribute("data-preview-device", "mobile");
    });
  });
});
