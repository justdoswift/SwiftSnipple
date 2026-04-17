import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSnippetBySlug } from "../services/snippets";
import type { Snippet } from "../types";
import SnippetDetail from "./SnippetDetail";

vi.mock("../services/snippets", () => ({
  getSnippetBySlug: vi.fn(),
}));

const mockedGetSnippetBySlug = vi.mocked(getSnippetBySlug);

const detailedSnippet: Snippet = {
  id: "snippet-1",
  title: "Smooth Feedback Loops",
  slug: "smooth-feedback-loops",
  excerpt: "A polished snippet preview.",
  category: "Workflow",
  tags: ["SwiftUI"],
  coverImage: "https://example.com/cover.jpg",
  content: `# Notes

\`\`\`swift
Text("Hello")
\`\`\``,
  code: "Text(\"Source\")",
  prompts: "Keep the action anchored while the state evolves.",
  seoTitle: "Smooth Feedback Loops",
  seoDescription: "SEO copy",
  status: "Published",
  updatedAt: "2026-04-09T12:00:00.000Z",
  publishedAt: "2026-04-09T12:00:00.000Z",
};

describe("SnippetDetail", () => {
  beforeEach(() => {
    mockedGetSnippetBySlug.mockReset();
  });

  it("renders floating copy controls across public code surfaces", async () => {
    mockedGetSnippetBySlug.mockResolvedValue(detailedSnippet);

    render(
      <MemoryRouter initialEntries={["/snippets/smooth-feedback-loops"]}>
        <Routes>
          <Route path="/snippets/:slug" element={<SnippetDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Smooth Feedback Loops" })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Copy Swift code" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy prompt logic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy code block" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy Swift code" }).closest(".code-copy-shell")?.querySelector(".markdown-code-block")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy prompt logic" }).closest(".code-copy-shell")?.querySelector(".markdown-code-block")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy Swift code" }).closest(".public-code-surface")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy prompt logic" }).closest(".public-code-surface")).not.toBeInTheDocument();
  });
});
