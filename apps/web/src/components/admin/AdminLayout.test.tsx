import { Children, cloneElement, isValidElement, useState, type FocusEvent, type MouseEvent, type PointerEvent, type ReactElement, type ReactNode } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import AdminSnippetEditor from "../../pages/admin/AdminSnippetEditor";
import AdminSnippets from "../../pages/admin/AdminSnippets";
import { getSnippets } from "../../services/snippets";
import { Snippet } from "../../types";
import AdminLayout from "./AdminLayout";
import type { AdminAuthSession } from "../../lib/admin-auth";
import { PublicThemeContext } from "../../lib/public-theme";

vi.mock("../../lib/heroui", async () => {
  const actual = await vi.importActual<typeof import("../../lib/heroui")>("../../lib/heroui");

  function MockTooltipContent({ children }: { children: ReactNode }) {
    return <>{children}</>;
  }

  function MockTooltipTrigger({ children }: { children: ReactNode }) {
    return <>{children}</>;
  }

  function MockTooltipRoot({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const childArray = Children.toArray(children);
    const contentChild = childArray.find((child) => isValidElement(child) && child.type === MockTooltipContent);
    const triggerChild = childArray.find((child) => isValidElement(child) && child.type === MockTooltipTrigger);

    if (!isValidElement(triggerChild)) {
      return <>{children}</>;
    }

    const triggerElement = triggerChild as ReactElement<{ children?: ReactNode }>;
    const triggerNode = Children.only(triggerElement.props.children) as ReactElement<Record<string, any>>;
    const elementProps = triggerNode.props as Record<string, any>;
    const tooltipContent = isValidElement(contentChild)
      ? (contentChild as ReactElement<{ children?: ReactNode }>).props.children
      : null;

    return (
      <>
        {cloneElement(triggerNode, {
          onMouseEnter: (event: MouseEvent<HTMLElement>) => {
            elementProps.onMouseEnter?.(event);
            setOpen(true);
          },
          onMouseLeave: (event: MouseEvent<HTMLElement>) => {
            elementProps.onMouseLeave?.(event);
            setOpen(false);
          },
          onPointerEnter: (event: PointerEvent<HTMLElement>) => {
            elementProps.onPointerEnter?.(event);
            setOpen(true);
          },
          onFocus: (event: FocusEvent<HTMLElement>) => {
            elementProps.onFocus?.(event);
            setOpen(true);
          },
          onBlur: (event: FocusEvent<HTMLElement>) => {
            elementProps.onBlur?.(event);
            setOpen(false);
          },
        })}
        {open ? <div role="tooltip" className="tooltip">{tooltipContent}</div> : null}
      </>
    );
  }

  const MockTooltip = Object.assign(MockTooltipRoot, {
    Root: MockTooltipRoot,
    Trigger: MockTooltipTrigger,
    Content: MockTooltipContent,
  });

  return {
    ...actual,
    Tooltip: MockTooltip,
    TooltipRoot: MockTooltipRoot,
    TooltipTrigger: MockTooltipTrigger,
    TooltipContent: MockTooltipContent,
  };
});

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

function renderAdminRoute(initialEntry: string, onToggleTheme = vi.fn(), theme: "dark" | "light" = "dark") {
  return render(
    <PublicThemeContext.Provider value={theme}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/en/admin"
            element={<AdminLayout adminAuthSession={adminAuthSession} onSignOut={vi.fn()} onToggleTheme={onToggleTheme} />}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="snippets" element={<AdminSnippets />} />
            <Route path="snippets/new" element={<AdminSnippetEditor />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </PublicThemeContext.Provider>,
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
    const navShell = screen.getByTestId("admin-navbar-shell");

    expect(navShell).toHaveClass("w-full", "px-4", "md:px-6", "lg:px-8");
    expect(navShell).not.toHaveClass("mx-auto", "max-w-[1400px]");
    expect(screen.getByRole("link", { name: "Just Do Swift admin" })).toBeInTheDocument();
    expect(header).not.toBeNull();
    const newLink = within(header!).getByRole("link", { name: "New" });
    const themeButton = within(header!).getByRole("button", { name: "Switch to light site mode" });
    const logOutButton = within(header!).getByRole("button", { name: "Log out" });
    const localeButton = within(header!).getByRole("button", { name: "Select language" });
    const frontSiteLink = within(header!).getByRole("link", { name: /View Front Site/i });

    expect(newLink).toHaveAttribute("href", "/en/admin/snippets/new");
    expect(newLink).toHaveClass("admin-nav-action-icon");
    expect(themeButton).toHaveClass("admin-nav-action-icon");
    expect(logOutButton).toHaveClass("admin-nav-action-icon");
    expect(localeButton).toHaveClass("admin-nav-action-icon");
    expect(frontSiteLink).toHaveClass("admin-nav-action-icon");
    const newIcon = newLink.querySelector("svg");
    expect(newIcon).not.toBeNull();
    expect(newIcon).toHaveClass("h-5", "w-5");
    expect(newIcon).not.toHaveClass("h-4", "w-4");
    expect(within(header!).queryByText("New")).not.toBeInTheDocument();
    expect(within(header!).queryByText("Log out")).not.toBeInTheDocument();
    expect(within(header!).queryByText("English")).not.toBeInTheDocument();
    expect(within(header!).queryByText("中文")).not.toBeInTheDocument();

    fireEvent.pointerEnter(newLink);
    fireEvent.mouseEnter(newLink);
    fireEvent.focus(newLink);
    expect(await screen.findByText("New")).toBeInTheDocument();
    fireEvent.mouseLeave(newLink);

    fireEvent.pointerEnter(localeButton);
    fireEvent.mouseEnter(localeButton);
    fireEvent.focus(localeButton);
    expect(await screen.findByText("Select language")).toBeInTheDocument();
    fireEvent.mouseLeave(localeButton);
    fireEvent.click(localeButton);
    const localeMenu = await screen.findByRole("menu");
    expect(localeMenu).toHaveClass("dropdown__menu");
    expect(localeMenu.closest(".dropdown__popover")).not.toBeNull();
    expect(screen.getByText("English").closest(".menu-item")).not.toBeNull();
    expect(screen.getByText("中文").closest(".menu-item")).not.toBeNull();

    fireEvent.pointerEnter(themeButton);
    fireEvent.mouseEnter(themeButton);
    fireEvent.focus(themeButton);
    expect(await screen.findByText("Switch to light site mode")).toBeInTheDocument();
    fireEvent.mouseLeave(themeButton);

    fireEvent.pointerEnter(frontSiteLink);
    fireEvent.mouseEnter(frontSiteLink);
    fireEvent.focus(frontSiteLink);
    expect(await screen.findByText("View Front Site")).toBeInTheDocument();
    fireEvent.mouseLeave(frontSiteLink);

    fireEvent.pointerEnter(logOutButton);
    fireEvent.mouseEnter(logOutButton);
    fireEvent.focus(logOutButton);
    expect(await screen.findByText("Log out")).toBeInTheDocument();
    fireEvent.mouseLeave(logOutButton);

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
    expect(within(header!).getByRole("link", { name: "New" })).toHaveClass("admin-nav-action-icon");
    expect(within(header!).getByRole("button", { name: "Switch to light site mode" })).toHaveClass("admin-nav-action-icon");
    expect(within(header!).getByRole("button", { name: "Log out" })).toHaveClass("admin-nav-action-icon");
    expect(within(header!).getByRole("button", { name: "Select language" })).toHaveClass("admin-nav-action-icon");
    expect(within(header!).getByRole("link", { name: /View Front Site/i })).toHaveClass("admin-nav-action-icon");
    expect(within(header!).queryByText("New")).not.toBeInTheDocument();
    expect(within(header!).queryByText("Log out")).not.toBeInTheDocument();
    expect(within(header!).queryByText("English")).not.toBeInTheDocument();
    expect(within(header!).queryByText("中文")).not.toBeInTheDocument();
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
    expect(within(header!).getByRole("button", { name: "Switch to light site mode" })).toHaveClass("admin-nav-action-icon");
    expect(within(header!).getByRole("button", { name: "Log out" })).toHaveClass("admin-nav-action-icon");
    expect(within(header!).getByRole("button", { name: "Select language" })).toHaveClass("admin-nav-action-icon");
    expect(within(header!).getByRole("link", { name: /View Front Site/i })).toHaveClass("admin-nav-action-icon");
    expect(within(header!).queryByText("Log out")).not.toBeInTheDocument();
    expect(within(header!).queryByText("English")).not.toBeInTheDocument();
    expect(within(header!).queryByText("中文")).not.toBeInTheDocument();
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
  });

  it("renders admin tooltips with the shared tooltip class", async () => {
    renderAdminRoute("/en/admin");

    await waitFor(() => {
      expect(screen.getByLabelText("Search title or slug")).toBeInTheDocument();
    });

    const header = screen.getByTestId("admin-navbar-shell").closest("header");
    expect(header).not.toBeNull();

    const logOutButton = within(header!).getByRole("button", { name: "Log out" });

    fireEvent.pointerEnter(logOutButton);
    fireEvent.mouseEnter(logOutButton);
    fireEvent.focus(logOutButton);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveClass("tooltip");
    expect(tooltip).toHaveTextContent("Log out");
  });

  it("calls the parent theme toggle handler and reflects the provided light theme", async () => {
    const onToggleTheme = vi.fn();
    renderAdminRoute("/en/admin", onToggleTheme, "light");

    await waitFor(() => {
      expect(screen.getByLabelText("Search title or slug")).toBeInTheDocument();
    });

    const themeRoot = screen.getByTestId("admin-theme-root");
    const themeButton = within(screen.getByTestId("admin-navbar-shell").closest("header")!).getByRole("button", {
      name: "Switch to dark site mode",
    });

    expect(themeRoot).toHaveAttribute("data-theme", "light");

    fireEvent.click(themeButton);

    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });
});
