import { createContext, useContext, useState, type ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import PublicSearch from "./PublicSearch";
import type { Snippet } from "../types";
import { createSnippet } from "../test/factories";

vi.mock("../lib/heroui", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  const searchContext = createContext<{
    value: string;
    onChange?: (value: string) => void;
    autoFocus?: boolean;
    ariaLabel?: string;
  }>({ value: "" });

  function MockModal({ children }: { children: ReactNode }) {
    return <>{children}</>;
  }

  MockModal.Backdrop = function MockModalBackdrop({
    children,
    isOpen,
    className,
  }: {
    children: ReactNode;
    isOpen?: boolean;
    className?: string;
  }) {
    if (!isOpen) {
      return null;
    }

    return <div className={className}>{children}</div>;
  };

  MockModal.Container = function MockModalContainer({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) {
    return <div className={className}>{children}</div>;
  };

  MockModal.Dialog = function MockModalDialog({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) {
    return <div role="dialog" className={className}>{children}</div>;
  };

  function MockSearchField({
    children,
    value = "",
    onChange,
    autoFocus,
    "aria-label": ariaLabel,
    className,
  }: {
    children: ReactNode;
    value?: string;
    onChange?: (value: string) => void;
    autoFocus?: boolean;
    "aria-label"?: string;
    className?: string;
  }) {
    return (
      <searchContext.Provider value={{ value, onChange, autoFocus, ariaLabel }}>
        <div className={className}>{children}</div>
      </searchContext.Provider>
    );
  }

  MockSearchField.Group = function MockSearchFieldGroup({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) {
    return <div className={className}>{children}</div>;
  };

  MockSearchField.SearchIcon = function MockSearchFieldSearchIcon({
    className,
  }: {
    className?: string;
  }) {
    return <span aria-hidden="true" className={className}>search</span>;
  };

  MockSearchField.Input = function MockSearchFieldInput({
    className,
    placeholder,
  }: {
    className?: string;
    placeholder?: string;
  }) {
    const context = useContext(searchContext);
    return (
      <input
        aria-label={context.ariaLabel}
        autoFocus={context.autoFocus}
        className={className}
        placeholder={placeholder}
        value={context.value}
        onChange={(event) => context.onChange?.(event.target.value)}
      />
    );
  };

  MockSearchField.ClearButton = function MockSearchFieldClearButton({
    className,
  }: {
    className?: string;
  }) {
    const context = useContext(searchContext);
    if (!context.value) {
      return null;
    }

    return (
      <button
        type="button"
        aria-label="Clear search"
        className={className}
        onClick={() => context.onChange?.("")}
      >
        clear
      </button>
    );
  };

  return {
    Modal: MockModal,
    SearchField: MockSearchField,
    Spinner: ({ size, className }: { size?: string; className?: string }) => (
      <div data-testid={`spinner-${size ?? "md"}`} className={className}>
        spinner
      </div>
    ),
  };
});

const publishedSnippet: Snippet = createSnippet({
  coverImage: "/api/uploads/search.webp",
  code: 'Text("Glass")',
  updatedAt: "2026-04-19T10:00:00.000Z",
  publishedAt: "2026-04-19T10:00:00.000Z",
  locales: {
    en: {
      title: "Glass Navigation",
      slug: "glass-navigation",
      excerpt: "A published snippet for search.",
      category: "Navigation",
      tags: ["SwiftUI"],
      content: "A polished content match.",
      prompts: "Find this snippet by prompt.",
      seoTitle: "Glass Navigation",
      seoDescription: "SEO copy",
    },
    zh: {
      title: "玻璃导航",
      slug: "boli-daohang",
      excerpt: "一个用于搜索的已发布 snippet。",
      category: "导航",
      tags: ["SwiftUI"],
      content: "一个精致的内容命中。",
      prompts: "可以通过提示词找到它。",
      seoTitle: "玻璃导航",
      seoDescription: "SEO copy",
    },
  },
});

function SearchHarness({
  initialOpen = true,
  loadSnippets,
}: {
  initialOpen?: boolean;
  loadSnippets: () => Promise<Snippet[]>;
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const location = useLocation();

  return (
    <>
      <div data-testid="location-display">{location.pathname}</div>
      <PublicSearch isOpen={isOpen} onOpenChange={setIsOpen} loadSnippets={loadSnippets} />
      <button type="button" onClick={() => setIsOpen(true)}>
        reopen
      </button>
    </>
  );
}

describe("PublicSearch", () => {
  it("shows a loading state while fetching the published snippet index", () => {
    const loadSnippets = () => new Promise<Snippet[]>(() => {});

    render(
      <MemoryRouter initialEntries={["/"]}>
        <SearchHarness loadSnippets={loadSnippets} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("public-search-loading")).toBeInTheDocument();
    expect(screen.getByTestId("spinner-sm")).toHaveClass("public-search-spinner");
    expect(screen.getByRole("dialog")).toHaveClass("public-search-dialog");
    expect(screen.getByRole("textbox", { name: "Search the snippet library" }).closest(".public-search-field-group")).not.toBeNull();
  });

  it("shows the idle state before a query is entered", async () => {
    const loadSnippets = async () => [publishedSnippet];

    render(
      <MemoryRouter initialEntries={["/"]}>
        <SearchHarness loadSnippets={loadSnippets} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("public-search-idle")).toBeInTheDocument();
    });
  });

  it("shows an empty state when no snippets match the query", async () => {
    const loadSnippets = async () => [publishedSnippet];

    render(
      <MemoryRouter initialEntries={["/"]}>
        <SearchHarness loadSnippets={loadSnippets} />
      </MemoryRouter>,
    );

    const input = await screen.findByRole("textbox", { name: "Search the snippet library" });
    fireEvent.change(input, { target: { value: "nonexistent" } });

    await waitFor(() => {
      expect(screen.getByTestId("public-search-empty")).toBeInTheDocument();
    });
  });

  it("shows an error state when the snippet index request fails", async () => {
    const loadSnippets = async () => {
      throw new Error("boom");
    };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <SearchHarness loadSnippets={loadSnippets} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("public-search-error")).toBeInTheDocument();
    });
  });

  it("renders matching results and closes after navigating to a snippet", async () => {
    const loadSnippets = async () => [publishedSnippet];

    render(
      <MemoryRouter initialEntries={["/"]}>
        <SearchHarness loadSnippets={loadSnippets} />
      </MemoryRouter>,
    );

    const input = await screen.findByRole("textbox", { name: "Search the snippet library" });
    fireEvent.change(input, { target: { value: "glass" } });

    const result = await screen.findByRole("link", { name: /Glass Navigation/i });
    expect(result.querySelector(".public-search-result-media")).toHaveClass("snippet-cover-frame");
    fireEvent.click(result);

    await waitFor(() => {
      expect(screen.getByTestId("location-display")).toHaveTextContent("/snippets/glass-navigation");
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
