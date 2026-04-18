import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminLayout from "../../components/admin/AdminLayout";
import type { AdminAuthSession } from "../../lib/admin-auth";
import AdminSnippetEditor from "./AdminSnippetEditor";
import { createSnippet, deleteSnippet, getSnippetById, publishSnippet, updateSnippet } from "../../services/snippets";

vi.mock("../../services/snippets", () => ({
  createSnippet: vi.fn(),
  deleteSnippet: vi.fn(),
  getSnippetById: vi.fn(),
  publishSnippet: vi.fn(),
  unpublishSnippet: vi.fn(),
  updateSnippet: vi.fn(),
}));

const mockedGetSnippetById = vi.mocked(getSnippetById);
const mockedCreateSnippet = vi.mocked(createSnippet);
const mockedDeleteSnippet = vi.mocked(deleteSnippet);
const mockedPublishSnippet = vi.mocked(publishSnippet);
const mockedUpdateSnippet = vi.mocked(updateSnippet);

const adminAuthSession: AdminAuthSession = {
  email: "creator@example.com",
  provider: "email",
  createdAt: "2026-04-18T00:00:00.000Z",
};

afterEach(() => {
  vi.useRealTimers();
});

describe("AdminSnippetEditor", () => {
  it("renders the new snippet editor route without inline preview", () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();

    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
            <Route path="snippets/:id" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Snippet Title")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to snippets" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Narrative" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Code" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Prompt" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Surface" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view front site/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Implementation notes")).toHaveClass("admin-editor-scrollbar");
    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    expect(screen.getByLabelText("SwiftUI code")).toHaveClass("admin-editor-scrollbar");
    fireEvent.click(screen.getByRole("tab", { name: "Prompt" }));
    expect(screen.getByLabelText("Prompt notes")).toHaveClass("admin-editor-scrollbar");
    expect(screen.queryByText("Prompt logic")).not.toBeInTheDocument();
    expect(screen.queryByText("Prompt notes", { selector: "span, p" })).not.toBeInTheDocument();
    expect(screen.queryByText("Live preview")).not.toBeInTheDocument();
    expect(screen.queryByText("Shared with public view")).not.toBeInTheDocument();
  });

  it("renders the new snippet editor route", () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();

    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
            <Route path="snippets/:id" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Snippet Title")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to snippets" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Narrative" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Code" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Prompt" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Surface" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view front site/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Implementation notes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByText("Save this draft first to open the public preview at /snippets/untitled.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
  });

  it("opens preview mode with device controls for saved snippets", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
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
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
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

  it("opens a publish confirmation dialog before calling the publish API", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedCreateSnippet.mockResolvedValue({
      id: "snippet-1",
      title: "Untitled Snippet",
      slug: "untitled-snippet",
      excerpt: "",
      category: "Workflow",
      tags: [],
      coverImage: "https://example.com/cover.jpg",
      content: "# New Snippet",
      code: "Text(\"Hello\")",
      prompts: "Build a polished snippet.",
      seoTitle: "",
      seoDescription: "",
      status: "Draft",
      updatedAt: "2026-04-18T00:00:00.000Z",
      publishedAt: null,
    });
    mockedPublishSnippet.mockResolvedValue({
      id: "snippet-1",
      title: "Untitled Snippet",
      slug: "untitled-snippet",
      excerpt: "",
      category: "Workflow",
      tags: [],
      coverImage: "https://example.com/cover.jpg",
      content: "# New Snippet",
      code: "Text(\"Hello\")",
      prompts: "Build a polished snippet.",
      seoTitle: "",
      seoDescription: "",
      status: "Published",
      updatedAt: "2026-04-18T00:00:00.000Z",
      publishedAt: "2026-04-18T00:00:00.000Z",
    });

    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
            <Route path="snippets/:id" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    expect(screen.getByText("Publish this snippet to the public library?")).toBeInTheDocument();
    expect(mockedPublishSnippet).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Publish this snippet to the public library?")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Publish" }));
    expect(screen.queryByText("Publish this snippet to the public library?")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockedCreateSnippet).toHaveBeenCalledTimes(1);
      expect(mockedPublishSnippet).toHaveBeenCalledWith("snippet-1");
      expect(screen.getByRole("button", { name: "Published" })).toBeDisabled();
    });
  });

  it("auto-saves a new snippet after the first edit", async () => {
    vi.useFakeTimers();
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUpdateSnippet.mockReset();
    mockedCreateSnippet.mockResolvedValue({
      id: "snippet-1",
      title: "Fresh Draft",
      slug: "fresh-draft",
      excerpt: "",
      category: "Workflow",
      tags: [],
      coverImage: "https://example.com/cover.jpg",
      content: "# New Snippet",
      code: "Text(\"Hello\")",
      prompts: "Build a polished snippet.",
      seoTitle: "",
      seoDescription: "",
      status: "Draft",
      updatedAt: "2026-04-18T00:00:00.000Z",
      publishedAt: null,
    });

    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
            <Route path="snippets/:id" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Snippet Title"), { target: { value: "Fresh Draft" } });

    await act(async () => {
      vi.advanceTimersByTime(950);
      await Promise.resolve();
    });

    expect(mockedCreateSnippet).toHaveBeenCalledTimes(1);
    expect(mockedUpdateSnippet).not.toHaveBeenCalled();
  });

  it("opens a HeroUI delete confirmation modal before deleting", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUpdateSnippet.mockReset();
    mockedDeleteSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue({
      id: "snippet-1",
      title: "Live Snippet",
      slug: "live-snippet",
      excerpt: "Published snippet.",
      category: "Workflow",
      tags: ["SwiftUI"],
      coverImage: "https://example.com/cover.jpg",
      content: "# Live Snippet",
      code: "Text(\"Live\")",
      prompts: "Keep it polished.",
      seoTitle: "Live Snippet",
      seoDescription: "SEO copy",
      status: "Draft",
      updatedAt: "2026-04-18T00:00:00.000Z",
      publishedAt: null,
    });
    mockedDeleteSnippet.mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={["/admin/snippets/snippet-1"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets" element={<div>Snippet Library</div>} />
            <Route path="snippets/:id" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Snippet Title")).toHaveValue("Live Snippet");
    });

    fireEvent.click(screen.getByRole("tab", { name: "Surface" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Snippet" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete this snippet permanently?")).toBeInTheDocument();
    expect(mockedDeleteSnippet).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(mockedDeleteSnippet).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete Snippet" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete Snippet" }));

    await waitFor(() => {
      expect(mockedDeleteSnippet).toHaveBeenCalledWith("snippet-1");
      expect(screen.getByText("Snippet Library")).toBeInTheDocument();
    });
  });

  it("turns Published into Update when a published snippet is edited", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUpdateSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue({
      id: "snippet-1",
      title: "Live Snippet",
      slug: "live-snippet",
      excerpt: "Published snippet.",
      category: "Workflow",
      tags: ["SwiftUI"],
      coverImage: "https://example.com/cover.jpg",
      content: "# Live Snippet",
      code: "Text(\"Live\")",
      prompts: "Keep it polished.",
      seoTitle: "Live Snippet",
      seoDescription: "SEO copy",
      status: "Published",
      updatedAt: "2026-04-18T00:00:00.000Z",
      publishedAt: "2026-04-18T00:00:00.000Z",
    });

    render(
      <MemoryRouter initialEntries={["/admin/snippets/snippet-1"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/:id" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Published" })).toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText("Snippet Title"), { target: { value: "Live Snippet Updated" } });

    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(mockedUpdateSnippet).not.toHaveBeenCalled();
  });

  it("updates a published snippet only after confirmation", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUpdateSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue({
      id: "snippet-1",
      title: "Live Snippet",
      slug: "live-snippet",
      excerpt: "Published snippet.",
      category: "Workflow",
      tags: ["SwiftUI"],
      coverImage: "https://example.com/cover.jpg",
      content: "# Live Snippet",
      code: "Text(\"Live\")",
      prompts: "Keep it polished.",
      seoTitle: "Live Snippet",
      seoDescription: "SEO copy",
      status: "Published",
      updatedAt: "2026-04-18T00:00:00.000Z",
      publishedAt: "2026-04-18T00:00:00.000Z",
    });
    mockedUpdateSnippet.mockResolvedValue({
      id: "snippet-1",
      title: "Live Snippet Updated",
      slug: "live-snippet",
      excerpt: "Published snippet.",
      category: "Workflow",
      tags: ["SwiftUI"],
      coverImage: "https://example.com/cover.jpg",
      content: "# Live Snippet",
      code: "Text(\"Live\")",
      prompts: "Keep it polished.",
      seoTitle: "Live Snippet",
      seoDescription: "SEO copy",
      status: "Published",
      updatedAt: "2026-04-18T00:10:00.000Z",
      publishedAt: "2026-04-18T00:00:00.000Z",
    });
    mockedPublishSnippet.mockResolvedValue({
      id: "snippet-1",
      title: "Live Snippet Updated",
      slug: "live-snippet",
      excerpt: "Published snippet.",
      category: "Workflow",
      tags: ["SwiftUI"],
      coverImage: "https://example.com/cover.jpg",
      content: "# Live Snippet",
      code: "Text(\"Live\")",
      prompts: "Keep it polished.",
      seoTitle: "Live Snippet",
      seoDescription: "SEO copy",
      status: "Published",
      updatedAt: "2026-04-18T00:12:00.000Z",
      publishedAt: "2026-04-18T00:12:00.000Z",
    });

    render(
      <MemoryRouter initialEntries={["/admin/snippets/snippet-1"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/:id" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Published" })).toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText("Snippet Title"), { target: { value: "Live Snippet Updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    expect(screen.getByText("Update this snippet in the public library?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm Update" }));
    expect(screen.queryByText("Update this snippet in the public library?")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockedUpdateSnippet).toHaveBeenCalledWith(
        "snippet-1",
        expect.objectContaining({
          title: "Live Snippet Updated",
        }),
      );
      expect(mockedPublishSnippet).toHaveBeenCalledWith("snippet-1");
      expect(screen.getByRole("button", { name: "Published" })).toBeDisabled();
    });
  });

  it("removes Published from manual status choices for unpublished snippets", () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();

    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Surface" }));

    expect(screen.queryByRole("option", { name: "Published" })).not.toBeInTheDocument();
  });

  it("shows Published as a disabled status for already published snippets", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue({
      id: "snippet-1",
      title: "Live Snippet",
      slug: "live-snippet",
      excerpt: "Published snippet.",
      category: "Workflow",
      tags: ["SwiftUI"],
      coverImage: "https://example.com/cover.jpg",
      content: "# Live Snippet",
      code: "Text(\"Live\")",
      prompts: "Keep it polished.",
      seoTitle: "Live Snippet",
      seoDescription: "SEO copy",
      status: "Published",
      updatedAt: "2026-04-18T00:00:00.000Z",
      publishedAt: "2026-04-18T00:00:00.000Z",
    });

    render(
      <MemoryRouter initialEntries={["/admin/snippets/snippet-1"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/:id" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Snippet Title")).toHaveValue("Live Snippet");
    });

    fireEvent.click(screen.getByRole("tab", { name: "Surface" }));

    const publishedOption = screen.getByRole("option", { name: "Published" });
    expect(publishedOption).toBeDisabled();
  });
});
