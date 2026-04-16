import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminSnippetEditor from "./AdminSnippetEditor";

vi.mock("../../services/snippets", () => ({
  createSnippet: vi.fn(),
  deleteSnippet: vi.fn(),
  getSnippetById: vi.fn(),
  publishSnippet: vi.fn(),
  unpublishSnippet: vi.fn(),
  updateSnippet: vi.fn(),
}));

describe("AdminSnippetEditor", () => {
  it("renders the new snippet editor route", () => {
    render(
      <MemoryRouter initialEntries={["/admin/snippets/new"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("New entry")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to snippets" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Narrative" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Builder" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Surface" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view front site/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Implementation notes")).toBeInTheDocument();
  });
});
