import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminLayout from "../../components/admin/AdminLayout";
import type { AdminAuthSession } from "../../lib/admin-auth";
import { LocaleContext } from "../../lib/locale";
import AdminSnippetEditor from "./AdminSnippetEditor";
import { createSnippet, deleteSnippet, getSnippetById, publishSnippet, updateSnippet, uploadContentImage, uploadContentImageFromURL, uploadContentVideo, uploadCoverImage } from "../../services/snippets";
import { createSnippet as createSnippetFixture } from "../../test/factories";

vi.mock("../../services/snippets", () => ({
  createSnippet: vi.fn(),
  deleteSnippet: vi.fn(),
  getSnippetById: vi.fn(),
  publishSnippet: vi.fn(),
  unpublishSnippet: vi.fn(),
  updateSnippet: vi.fn(),
  uploadContentImage: vi.fn(),
  uploadContentImageFromURL: vi.fn(),
  uploadContentVideo: vi.fn(),
  uploadCoverImage: vi.fn(),
}));

const mockedGetSnippetById = vi.mocked(getSnippetById);
const mockedCreateSnippet = vi.mocked(createSnippet);
const mockedDeleteSnippet = vi.mocked(deleteSnippet);
const mockedPublishSnippet = vi.mocked(publishSnippet);
const mockedUpdateSnippet = vi.mocked(updateSnippet);
const mockedUploadContentImage = vi.mocked(uploadContentImage);
const mockedUploadContentImageFromURL = vi.mocked(uploadContentImageFromURL);
const mockedUploadContentVideo = vi.mocked(uploadContentVideo);
const mockedUploadCoverImage = vi.mocked(uploadCoverImage);

const adminAuthSession: AdminAuthSession = {
  email: "creator@example.com",
  provider: "email",
  createdAt: "2026-04-18T00:00:00.000Z",
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("AdminSnippetEditor", () => {
  it("renders the new snippet editor route without inline preview", () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUploadContentImage.mockReset();
    mockedUploadContentVideo.mockReset();
    mockedUploadCoverImage.mockReset();

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
    expect(screen.getByRole("button", { name: "Back to snippets" })).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Narrative" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Code" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Prompt" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Surface" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toHaveClass("admin-nav-action-icon");
    expect(screen.getByRole("button", { name: "Publish" })).toHaveClass("admin-nav-action-icon");
    expect(screen.getByRole("button", { name: "Publish" })).not.toHaveClass("admin-nav-action-icon-primary");
    expect(screen.getByRole("link", { name: /view front site/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /EN/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /中文/i })).toBeInTheDocument();
    expect(screen.getByTestId("admin-editor-title-row")).toContainElement(screen.getByLabelText("Snippet Title"));
    expect(screen.getByTestId("admin-editor-title-row")).toContainElement(screen.getByTestId("admin-editor-locale-switcher"));
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
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
    expect(screen.getByRole("button", { name: "Back to snippets" })).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
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
    expect(screen.getByText("Save this draft first to open the public preview at /snippets/untitled.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
  });

  it("uploads a local cover image and stores the returned url", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUploadCoverImage.mockResolvedValue({ url: "/api/uploads/cover-test.webp" });
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:cover-preview");
    URL.revokeObjectURL = vi.fn();

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

    const file = new File(["cover"], "cover.png", { type: "image/png" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput!, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockedUploadCoverImage).toHaveBeenCalledWith(file);
    });

    await waitFor(() => {
      expect(screen.getByAltText("Untitled Snippet")).toHaveAttribute("src", "blob:cover-preview");
    });

    expect(screen.queryByText("/api/uploads/cover-test.webp")).not.toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("formats markdown content and inserts uploaded media", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUploadContentImage.mockResolvedValue({ url: "/api/uploads/content-images/example.webp", mimeType: "image/webp" });

    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const notes = screen.getByLabelText("Implementation notes") as HTMLTextAreaElement;
    fireEvent.change(notes, { target: { value: "Hello world" } });
    notes.setSelectionRange(0, 5);
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Implementation notes")).toHaveValue("**Hello** world");
    });

    fireEvent.click(screen.getByRole("button", { name: "Image" }));
    const fileInput = document.querySelector('input[type="file"][accept*="image/png"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();
    fireEvent.change(fileInput!, { target: { files: [new File(["image"], "body.png", { type: "image/png" })] } });
    fireEvent.click(screen.getByRole("button", { name: "Insert into notes" }));

    await waitFor(() => {
      expect(mockedUploadContentImage).toHaveBeenCalled();
    });

    await waitFor(() => {
      const notesField = screen.getByLabelText("Implementation notes") as HTMLTextAreaElement;
      expect(notesField.value).toContain("![");
      expect(notesField.value).toContain("/api/uploads/content-images/example.webp");
    });
  });

  it("uploads pasted images into markdown notes", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUploadContentImage.mockResolvedValue({ url: "/api/uploads/content-images/pasted.webp", mimeType: "image/webp" });

    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const notes = screen.getByLabelText("Implementation notes") as HTMLTextAreaElement;
    fireEvent.change(notes, { target: { value: "Hello world" } });
    notes.setSelectionRange(11, 11);

    const file = new File(["image"], "clipboard.png", { type: "image/png" });
    fireEvent.paste(notes, {
      clipboardData: {
        items: [
          {
            kind: "file",
            type: "image/png",
            getAsFile: () => file,
          },
        ],
      },
    });

    await waitFor(() => {
      expect(mockedUploadContentImage).toHaveBeenCalledWith(file);
    });

    await waitFor(() => {
      expect(notes.value).toContain("![Snippet image](/api/uploads/content-images/pasted.webp)");
    });
  });

  it("uploads pasted images from clipboard files when items are unavailable", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUploadContentImage.mockResolvedValue({ url: "/api/uploads/content-images/pasted-files.webp", mimeType: "image/webp" });

    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const notes = screen.getByLabelText("Implementation notes") as HTMLTextAreaElement;
    const file = new File(["image"], "clipboard-files.png", { type: "image/png" });

    fireEvent.paste(notes, {
      clipboardData: {
        files: [file],
        items: [],
      },
    });

    await waitFor(() => {
      expect(mockedUploadContentImage).toHaveBeenCalledWith(file);
    });

    await waitFor(() => {
      expect(notes.value).toContain("![Snippet image](/api/uploads/content-images/pasted-files.webp)");
    });
  });

  it("uploads pasted html images from rich content", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUploadContentImageFromURL.mockResolvedValueOnce({
      url: "/api/uploads/content-images/from-html.webp",
      mimeType: "image/webp",
    });

    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const notes = screen.getByLabelText("Implementation notes") as HTMLTextAreaElement;
    fireEvent.change(notes, { target: { value: "Before paste" } });
    notes.setSelectionRange(notes.value.length, notes.value.length);

    fireEvent.paste(notes, {
      clipboardData: {
        files: [],
        items: [],
        getData: (type: string) =>
          type === "text/html"
            ? '<div><h2>Language Identification</h2><p>Tries to figure out what language a piece of text is in.</p><img src="https://substackcdn.com/example.png" alt="Substack figure" /></div>'
            : type === "text/plain"
              ? "Language Identification\nTries to figure out what language a piece of text is in."
              : "",
      },
    });

    await waitFor(() => {
      expect(mockedUploadContentImageFromURL).toHaveBeenCalledWith("https://substackcdn.com/example.png");
    });

    await waitFor(() => {
      expect(notes.value).toContain("Before paste");
      expect(notes.value).toContain("## Language Identification");
      expect(notes.value).toContain("Tries to figure out what language a piece of text is in.");
      expect(notes.value).toContain("![Substack figure](/api/uploads/content-images/from-html.webp)");
    });
  });

  it("keeps pasted html text when one remote image upload fails", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUploadContentImageFromURL
      .mockResolvedValueOnce({
        url: "/api/uploads/content-images/first.webp",
        mimeType: "image/webp",
      })
      .mockRejectedValueOnce(new Error("remote fetch failed"));

    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const notes = screen.getByLabelText("Implementation notes") as HTMLTextAreaElement;
    fireEvent.paste(notes, {
      clipboardData: {
        files: [],
        items: [],
        getData: (type: string) =>
          type === "text/html"
            ? '<div><p>One image works.</p><img src="https://substackcdn.com/first.png" alt="First figure" /><p>Second image fails.</p><img src="https://substackcdn.com/second.png" alt="Second figure" /></div>'
            : type === "text/plain"
              ? "One image works. Second image fails."
              : "",
      },
    });

    await waitFor(() => {
      expect(mockedUploadContentImageFromURL).toHaveBeenNthCalledWith(1, "https://substackcdn.com/first.png");
      expect(mockedUploadContentImageFromURL).toHaveBeenNthCalledWith(2, "https://substackcdn.com/second.png");
    });

    await waitFor(() => {
      expect(notes.value).toContain("One image works.");
      expect(notes.value).toContain("![First figure](/api/uploads/content-images/first.webp)");
      expect(notes.value).toContain("Second image fails.");
      expect(notes.value).toContain("[Second figure](https://substackcdn.com/second.png)");
    });
  });

  it("keeps normal paste behavior for non-image clipboard content", () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUploadContentImage.mockReset();

    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const notes = screen.getByLabelText("Implementation notes") as HTMLTextAreaElement;
    const preventDefault = vi.fn();
    fireEvent.paste(notes, {
      clipboardData: {
        items: [
          {
            kind: "string",
            type: "text/plain",
          },
        ],
      },
      preventDefault,
    });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(mockedUploadContentImage).not.toHaveBeenCalled();
  });

  it("supports undo and redo for the content editor", async () => {
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

    const notes = screen.getByLabelText("Implementation notes") as HTMLTextAreaElement;
    fireEvent.change(notes, { target: { value: "Hello world", selectionStart: 11, selectionEnd: 11 } });
    notes.setSelectionRange(0, 5);
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));

    await waitFor(() => {
      expect(notes.value).toBe("**Hello** world");
    });

    const undoButton = screen.getByRole("button", { name: "Undo" });
    const redoButton = screen.getByRole("button", { name: "Redo" });
    expect(undoButton).not.toBeDisabled();

    fireEvent.click(undoButton);
    await waitFor(() => {
      expect(notes.value).toBe("Hello world");
    });

    fireEvent.click(redoButton);
    await waitFor(() => {
      expect(notes.value).toBe("**Hello** world");
    });

    fireEvent.keyDown(notes, { key: "z", metaKey: true });
    await waitFor(() => {
      expect(notes.value).toBe("Hello world");
    });

    fireEvent.keyDown(notes, { key: "z", metaKey: true, shiftKey: true });
    await waitFor(() => {
      expect(notes.value).toBe("**Hello** world");
    });
  });

  it("returns to the snippet library from the editor header back button", () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();

    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets" element={<div>snippet library route</div>} />
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Back to snippets" }));

    expect(screen.getByText("snippet library route")).toBeInTheDocument();
  });

  it("uses the shared HeroUI dropdown classes for the editor status menu", async () => {
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

    await waitFor(() => {
      expect(screen.getByLabelText("Snippet Title")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("tab", { name: "Surface" }));

    const visibilityTrigger = screen.getByRole("button", { name: "Visibility" });
    expect(within(visibilityTrigger).getByText("Free")).toBeInTheDocument();

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

    fireEvent.click(visibilityTrigger);

    const visibilityMenu = await screen.findByRole("menu");
    expect(within(visibilityMenu).getByText("Free")).toBeInTheDocument();
    expect(within(visibilityMenu).getByText("Subscribers only")).toBeInTheDocument();
  });

  it("switches the content editor language independently of the admin chrome locale", async () => {
    mockedGetSnippetById.mockReset();
    mockedGetSnippetById.mockResolvedValue(createSnippetFixture({
      title: "English Title",
      slug: "english-title",
      locales: {
        en: {
          title: "English Title",
          slug: "english-title",
          excerpt: "English excerpt",
          category: "Workflow",
          tags: ["SwiftUI"],
          content: "English content",
          prompts: "English prompts",
          seoTitle: "English SEO",
          seoDescription: "English description",
        },
        zh: {
          title: "中文标题",
          slug: "zhong-wen-biao-ti",
          excerpt: "中文摘要",
          category: "工作流",
          tags: ["SwiftUI"],
          content: "中文内容",
          prompts: "中文提示词",
          seoTitle: "中文 SEO",
          seoDescription: "中文描述",
        },
      },
    }));

    render(
      <LocaleContext.Provider value={{ locale: "zh" }}>
        <MemoryRouter initialEntries={["/admin/snippets/snippet-1"]}>
          <Routes>
            <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
              <Route path="snippets/:id" element={<AdminSnippetEditor />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </LocaleContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Snippet 标题")).toHaveValue("中文标题");
    });

    expect(screen.getByTestId("admin-editor-title-row")).toContainElement(screen.getByTestId("admin-editor-locale-switcher"));

    fireEvent.click(screen.getByRole("button", { name: /EN/i }));

    await waitFor(() => {
      expect(screen.getByLabelText("Snippet 标题")).toHaveValue("English Title");
    });
  });

  it("maps visibility dropdown choices to requiresSubscription during autosave", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUpdateSnippet.mockReset();
    mockedCreateSnippet.mockResolvedValue(createSnippetFixture({
      id: "snippet-1",
      title: "Paid Snippet",
      slug: "paid-snippet",
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
      requiresSubscription: true,
    }));

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

    fireEvent.change(screen.getByLabelText("Snippet Title"), { target: { value: "Paid Snippet" } });
    fireEvent.click(screen.getByRole("tab", { name: "Surface" }));
    fireEvent.click(screen.getByRole("button", { name: "Visibility" }));
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Subscribers only" }));

    await waitFor(() => {
      expect(mockedCreateSnippet).toHaveBeenCalledWith(expect.objectContaining({
        requiresSubscription: true,
      }));
    });
  });

  it("renders localized preview controls in the zh editor route", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue(createSnippetFixture({
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
      locales: {
        en: {
          title: "Smooth Feedback Loops",
          slug: "smooth-feedback-loops",
          excerpt: "A polished snippet preview.",
          category: "Workflow",
          tags: ["SwiftUI"],
          content: "# Smooth Feedback Loops",
          prompts: "Build a previewable snippet.",
          seoTitle: "Smooth Feedback Loops",
          seoDescription: "SEO copy",
        },
        zh: {
          title: "Smooth Feedback Loops",
          slug: "smooth-feedback-loops",
          excerpt: "A polished snippet preview.",
          category: "Workflow",
          tags: ["SwiftUI"],
          content: "# Smooth Feedback Loops",
          prompts: "Build a previewable snippet.",
          seoTitle: "Smooth Feedback Loops",
          seoDescription: "SEO copy",
        },
      },
    }));

    render(
      <LocaleContext.Provider value={{ locale: "zh" }}>
        <MemoryRouter initialEntries={["/admin/snippets/snippet-1"]}>
          <Routes>
            <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
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
      "/snippets/smooth-feedback-loops?preview=admin&id=snippet-1&locale=zh&rev=0",
    );
  });

  it("refreshes the preview iframe after autosaving a published draft update", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUpdateSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue(createSnippetFixture({
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
    }));
    mockedUpdateSnippet.mockResolvedValue(createSnippetFixture({
      id: "snippet-1",
      title: "Live Snippet Updated",
      slug: "live-snippet-updated",
      excerpt: "Published snippet.",
      category: "Workflow",
      tags: ["SwiftUI"],
      coverImage: "https://example.com/cover.jpg",
      content: "# Live Snippet Updated",
      code: "Text(\"Live\")",
      prompts: "Keep it polished.",
      seoTitle: "Live Snippet",
      seoDescription: "SEO copy",
      status: "Published",
      updatedAt: "2026-04-18T00:10:00.000Z",
      publishedAt: "2026-04-18T00:00:00.000Z",
      livePublishedAt: "2026-04-18T00:00:00.000Z",
      draftUpdatedAt: "2026-04-18T00:10:00.000Z",
      hasUnpublishedChanges: true,
    }));

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

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    await waitFor(() => {
      expect(screen.getByTitle("Snippet public preview")).toHaveAttribute(
        "src",
        "/snippets/live-snippet?preview=admin&id=snippet-1&locale=en&rev=0",
      );
    });

    fireEvent.change(screen.getByLabelText("Snippet Title"), { target: { value: "Live Snippet Updated" } });

    await new Promise((resolve) => setTimeout(resolve, 1800));

    await waitFor(() => {
      expect(mockedUpdateSnippet).toHaveBeenCalled();
      expect(screen.getByTitle("Snippet public preview")).toHaveAttribute(
        "src",
        "/snippets/live-snippet-updated?preview=admin&id=snippet-1&locale=en&rev=1",
      );
    });
  }, 12000);

  it("uses the current editor language for preview urls even when the admin chrome locale differs", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue(createSnippetFixture({
      id: "snippet-1",
      title: "English Title",
      slug: "english-title",
      excerpt: "English excerpt.",
      category: "Workflow",
      tags: ["SwiftUI"],
      coverImage: "https://example.com/cover.jpg",
      content: "# English Title",
      code: "Text(\"Preview\")",
      prompts: "Build an English previewable snippet.",
      seoTitle: "English Title",
      seoDescription: "SEO copy",
      status: "Published",
      updatedAt: "2026-04-09T12:00:00.000Z",
      publishedAt: "2026-04-09T12:00:00.000Z",
      locales: {
        en: {
          title: "English Title",
          slug: "english-title",
          excerpt: "English excerpt.",
          category: "Workflow",
          tags: ["SwiftUI"],
          content: "# English Title",
          prompts: "Build an English previewable snippet.",
          seoTitle: "English Title",
          seoDescription: "SEO copy",
        },
        zh: {
          title: "中文标题",
          slug: "zhong-wen-biao-ti",
          excerpt: "中文摘要。",
          category: "工作流",
          tags: ["SwiftUI"],
          content: "# 中文标题",
          prompts: "构建一个可预览的中文 snippet。",
          seoTitle: "中文标题",
          seoDescription: "中文 SEO",
        },
      },
    }));

    render(
      <LocaleContext.Provider value={{ locale: "en" }}>
        <MemoryRouter initialEntries={["/admin/snippets/snippet-1"]}>
          <Routes>
            <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
              <Route path="snippets/:id" element={<AdminSnippetEditor />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </LocaleContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Snippet Title")).toHaveValue("English Title");
    });

    fireEvent.click(screen.getByRole("button", { name: /中文/i }));
    await waitFor(() => {
      expect(screen.getByLabelText("Snippet Title")).toHaveValue("中文标题");
    });

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    await waitFor(() => {
      expect(screen.getByTitle("Snippet public preview")).toHaveAttribute(
        "src",
        "/snippets/zhong-wen-biao-ti?preview=admin&id=snippet-1&locale=zh&rev=0",
      );
    });
  });

  it("opens a publish confirmation dialog before calling the publish API", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedCreateSnippet.mockResolvedValue(createSnippetFixture({
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
    }));
    mockedPublishSnippet.mockResolvedValue(createSnippetFixture({
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
    }));

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
    mockedCreateSnippet.mockResolvedValue(createSnippetFixture({
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
    }));

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

  it("does not autosave immediately when opening a published snippet with seconds in publishedAt", async () => {
    vi.useFakeTimers();
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUpdateSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue(createSnippetFixture({
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
      publishedAt: "2026-04-20T08:11:39.519917Z",
    }));

    render(
      <MemoryRouter initialEntries={["/admin/snippets/snippet-1"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/:id" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole("button", { name: "Published" })).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(4000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedUpdateSnippet).not.toHaveBeenCalled();
  });

  it("does not schedule repeated autosaves after saving a published draft update", async () => {
    vi.useFakeTimers();
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUpdateSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue(createSnippetFixture({
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
      publishedAt: "2026-04-20T08:11:39.519917Z",
    }));
    mockedUpdateSnippet.mockResolvedValue(createSnippetFixture({
      id: "snippet-1",
      title: "Live Snippet Updated",
      slug: "live-snippet-updated",
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
      publishedAt: "2026-04-20T08:11:39.519917Z",
      livePublishedAt: "2026-04-20T08:11:39.519917Z",
      draftUpdatedAt: "2026-04-18T00:10:00.000Z",
      hasUnpublishedChanges: true,
    }));

    render(
      <MemoryRouter initialEntries={["/admin/snippets/snippet-1"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
            <Route path="snippets/:id" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole("button", { name: "Published" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Snippet Title"), { target: { value: "Live Snippet Updated" } });

    await act(async () => {
      vi.advanceTimersByTime(2200);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedUpdateSnippet).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(4000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedUpdateSnippet).toHaveBeenCalledTimes(1);
  });

  it("opens a HeroUI delete confirmation modal before deleting", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUpdateSnippet.mockReset();
    mockedDeleteSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue(createSnippetFixture({
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
    }));
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

  it("turns Published into Update when a published snippet is edited and autosaves the draft update", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUpdateSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue(createSnippetFixture({
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
    }));
    mockedUpdateSnippet.mockResolvedValue(createSnippetFixture({
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
      livePublishedAt: "2026-04-18T00:00:00.000Z",
      draftUpdatedAt: "2026-04-18T00:10:00.000Z",
      hasUnpublishedChanges: true,
    }));

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
  });

  it("updates a published snippet only after confirmation", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUpdateSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue(createSnippetFixture({
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
    }));
    mockedUpdateSnippet.mockResolvedValue(createSnippetFixture({
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
      livePublishedAt: "2026-04-18T00:00:00.000Z",
      draftUpdatedAt: "2026-04-18T00:10:00.000Z",
      hasUnpublishedChanges: true,
    }));
    mockedPublishSnippet.mockResolvedValue(createSnippetFixture({
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
    }));

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
    await new Promise((resolve) => setTimeout(resolve, 1800));

    await waitFor(() => {
      expect(mockedUpdateSnippet.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole("button", { name: "Update" })).not.toBeDisabled();
    }, { timeout: 4000 });

    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    expect(screen.getByText("Update this snippet in the public library?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm Update" }));
    expect(screen.queryByText("Update this snippet in the public library?")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockedUpdateSnippet.mock.calls.length).toBeGreaterThanOrEqual(1);
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
  }, 12000);

  it("localizes published update actions in the zh editor route", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedUpdateSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue(createSnippetFixture({
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
    }));
    mockedUpdateSnippet.mockResolvedValue(createSnippetFixture({
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
      livePublishedAt: "2026-04-18T00:00:00.000Z",
      draftUpdatedAt: "2026-04-18T00:10:00.000Z",
      hasUnpublishedChanges: true,
    }));
    mockedPublishSnippet.mockResolvedValue(createSnippetFixture({
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
    }));

    render(
      <LocaleContext.Provider value={{ locale: "zh" }}>
        <MemoryRouter initialEntries={["/admin/snippets/snippet-1"]}>
          <Routes>
            <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
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
    await new Promise((resolve) => setTimeout(resolve, 1800));
    await waitFor(() => {
      expect(mockedUpdateSnippet.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole("button", { name: "更新" })).not.toBeDisabled();
    }, { timeout: 4000 });

    fireEvent.click(screen.getByRole("button", { name: "更新" }));
    expect(screen.getByText("确认更新前台内容库中的这条 snippet？")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "确认更新" })).toBeInTheDocument();
  }, 12000);

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

    const statusValue = document.querySelector(".admin-form-select-value");
    const statusTriggerElement = statusValue?.closest("button, [data-slot='dropdown-trigger']") as HTMLElement | null;
    expect(statusTriggerElement).toBeTruthy();

    fireEvent.click(statusTriggerElement!);

    const menu = screen.getByRole("menu");
    expect(within(menu).getByText("Draft")).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Published" })).not.toBeInTheDocument();
    expect(within(menu).queryByText("In Review")).not.toBeInTheDocument();
    expect(within(menu).queryByText("Scheduled")).not.toBeInTheDocument();
  });

  it("shows Published as a disabled status for already published snippets", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue(createSnippetFixture({
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
    }));

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

    expect(screen.getByRole("button", { name: "Status" })).toBeDisabled();
  });

  it("shows the saved visibility choice for localized editors", async () => {
    mockedGetSnippetById.mockReset();
    mockedCreateSnippet.mockReset();
    mockedPublishSnippet.mockReset();
    mockedGetSnippetById.mockResolvedValue(createSnippetFixture({
      id: "snippet-1",
      title: "Members Snippet",
      slug: "members-snippet",
      excerpt: "Subscriber access",
      category: "Workflow",
      tags: ["SwiftUI"],
      coverImage: "https://example.com/cover.jpg",
      content: "# Members Snippet",
      code: "Text(\"Members\")",
      prompts: "Keep this for subscribers.",
      seoTitle: "Members Snippet",
      seoDescription: "SEO copy",
      status: "Draft",
      updatedAt: "2026-04-18T00:00:00.000Z",
      publishedAt: null,
      requiresSubscription: true,
    }));

    render(
      <LocaleContext.Provider value={{ locale: "zh" }}>
        <MemoryRouter initialEntries={["/admin/snippets/snippet-1"]}>
          <Routes>
            <Route path="/admin" element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} />}>
              <Route path="snippets/:id" element={<AdminSnippetEditor />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </LocaleContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Snippet 标题")).toHaveValue("玻璃导航");
    });

    fireEvent.click(screen.getByRole("tab", { name: "表面" }));

    const visibilityTrigger = screen.getByRole("button", { name: "可见性" });
    expect(within(visibilityTrigger).getByText("仅订阅用户")).toBeInTheDocument();
  });
});
