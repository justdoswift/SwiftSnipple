import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminLayout from "../../components/admin/AdminLayout";
import type { AdminAuthSession } from "../../lib/admin-auth";
import { LocaleContext } from "../../lib/locale";
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
      <MemoryRouter initialEntries={["/en/admin/snippets/new"]}>
        <Routes>
          <Route path="/en/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
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
    expect(screen.getByRole("button", { name: "Preview" })).toHaveClass("admin-nav-action-icon");
    expect(screen.getByRole("button", { name: "Publish" })).toHaveClass("admin-nav-action-icon");
    expect(screen.getByRole("button", { name: "Publish" })).not.toHaveClass("admin-nav-action-icon-primary");
    expect(screen.getByRole("link", { name: /view front site/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "EN" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "中文" })).not.toBeInTheDocument();
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
      <MemoryRouter initialEntries={["/en/admin/snippets/new"]}>
        <Routes>
          <Route path="/en/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
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
    expect(screen.getByRole("button", { name: "Preview" })).toHaveClass("admin-nav-action-icon");
    expect(screen.getByRole("button", { name: "Publish" })).toHaveClass("admin-nav-action-icon");
    expect(screen.getByRole("button", { name: "Publish" })).not.toHaveClass("admin-nav-action-icon-primary");
    expect(screen.getByRole("link", { name: /view front site/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Implementation notes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByText("Save this draft first to open the public preview at /en/snippets/untitled.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
  });

  it("uses the shared HeroUI dropdown classes for the editor status menu", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();

    render(
      <MemoryRouter initialEntries={["/en/admin/snippets/new"]}>
        <Routes>
          <Route path="/en/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Snippet Title")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("tab", { name: "Surface" }));

    const statusValue = document.querySelector(".admin-form-select-value");
    expect(statusValue).toBeTruthy();
    const statusTriggerElement = statusValue?.closest("button, [data-slot='dropdown-trigger']") as HTMLElement | null;
    expect(statusTriggerElement).toBeTruthy();

    fireEvent.click(statusTriggerElement!);

    const menu = await screen.findByRole("menu");
    expect(menu).toHaveClass("dropdown__menu");
    expect(menu.closest(".dropdown__popover")).not.toBeNull();
    const selectedItem = within(menu).getByText("Draft").closest(".menu-item");
    expect(selectedItem).not.toBeNull();
    expect(selectedItem?.querySelector(".menu-item__indicator")).not.toBeNull();
  });

  it("renders localized preview controls in the zh editor route", async () => {
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
      <LocaleContext.Provider value={{ locale: "zh" }}>
        <MemoryRouter initialEntries={["/zh/admin/snippets/snippet-1"]}>
          <Routes>
            <Route path="/zh/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
              <Route path="snippets/:id" element={<AdminSnippetEditor />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </LocaleContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Snippet 标题")).toHaveValue("Smooth Feedback Loops");
    });

    fireEvent.click(screen.getByRole("button", { name: "预览" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "完成" })).toBeInTheDocument();
    });

    expect(screen.getByRole("tab", { name: "桌面" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "手机" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("button", { name: "完成" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "完成" })).toHaveClass("admin-preview-toolbar-button");
    expect(screen.getByRole("tab", { name: "手机" })).toHaveClass("admin-preview-toolbar-button");
    expect(screen.getByRole("tab", { name: "桌面" })).toHaveClass("admin-preview-toolbar-button");
    expect(screen.getByText("前台路由")).toBeInTheDocument();
    expect(screen.queryByText("预览模式")).not.toBeInTheDocument();
    expect(screen.queryByText("Smooth Feedback Loops for macOS Apps")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "新标签打开" })).not.toBeInTheDocument();
    expect(screen.getByTitle("Snippet public preview")).toHaveAttribute(
      "src",
      "/zh/snippets/smooth-feedback-loops?preview=admin",
    );
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
      <MemoryRouter initialEntries={["/en/admin/snippets/new"]}>
        <Routes>
          <Route path="/en/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
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
      <MemoryRouter initialEntries={["/en/admin/snippets/new"]}>
        <Routes>
          <Route path="/en/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
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
      <MemoryRouter initialEntries={["/en/admin/snippets/snippet-1"]}>
        <Routes>
          <Route path="/en/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
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
      <MemoryRouter initialEntries={["/en/admin/snippets/snippet-1"]}>
        <Routes>
          <Route path="/en/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
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
      <MemoryRouter initialEntries={["/en/admin/snippets/snippet-1"]}>
        <Routes>
          <Route path="/en/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
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
          locales: expect.objectContaining({
            en: expect.objectContaining({
              title: "Live Snippet Updated",
            }),
          }),
        }),
      );
      expect(mockedPublishSnippet).toHaveBeenCalledWith("snippet-1");
      expect(screen.getByRole("button", { name: "Published" })).toBeDisabled();
    });
  });

  it("localizes published update actions in the zh editor route", async () => {
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
      <LocaleContext.Provider value={{ locale: "zh" }}>
        <MemoryRouter initialEntries={["/zh/admin/snippets/snippet-1"]}>
          <Routes>
            <Route path="/zh/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
              <Route path="snippets/:id" element={<AdminSnippetEditor />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </LocaleContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "已发布" })).toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText("Snippet 标题"), { target: { value: "Live Snippet Updated" } });
    expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "更新" }));
    expect(screen.getByText("确认更新前台内容库中的这条 snippet？")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "确认更新" })).toBeInTheDocument();
  });

  it("removes Published from manual status choices for unpublished snippets", () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();

    render(
      <MemoryRouter initialEntries={["/en/admin/snippets/new"]}>
        <Routes>
          <Route path="/en/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
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
      <MemoryRouter initialEntries={["/en/admin/snippets/snippet-1"]}>
        <Routes>
          <Route path="/en/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/:id" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Snippet Title")).toHaveValue("Live Snippet");
    });

    fireEvent.click(screen.getByRole("tab", { name: "Surface" }));

    expect(screen.getByRole("button", { name: "Status" })).toBeDisabled();
  });
});
