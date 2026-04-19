import { Children, cloneElement, isValidElement, useState, type FocusEvent, type MouseEvent, type PointerEvent, type ReactElement, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar";
import type { PublicTheme } from "../lib/public-theme";
import type { MockAuthSession } from "../lib/mock-auth";

vi.mock("../lib/heroui", async () => {
  const actual = await vi.importActual<typeof import("../lib/heroui")>("../lib/heroui");

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
  };
});

function renderNavbar(
  theme: PublicTheme = "dark",
  onToggleTheme = vi.fn(),
  authSession: MockAuthSession | null = null,
) {
  return render(
    <MemoryRouter>
      <Navbar theme={theme} onToggleTheme={onToggleTheme} authSession={authSession} />
    </MemoryRouter>,
  );
}

describe("Navbar", () => {
  it("renders the hero-style brand and actions", () => {
    renderNavbar();

    expect(screen.getByTestId("public-navbar-shell")).toHaveClass("w-full", "px-4", "md:px-6", "lg:px-8");
    expect(screen.getByTestId("public-navbar-shell")).not.toHaveClass("mx-auto", "max-w-[1400px]");
    expect(screen.getByRole("link", { name: "Just Do Swift homepage" })).toBeInTheDocument();
    expect(screen.getByText("Just Do Swift")).toBeInTheDocument();
    const searchButton = screen.getByRole("button", { name: "Search snippets" });
    const themeButton = screen.getByRole("button", { name: "Switch to light site mode" });
    const localeButton = screen.getByRole("button", { name: "Select language" });
    const authLink = screen.getByRole("link", { name: "Log in" });

    expect(searchButton).toHaveClass("public-nav-icon-button");
    expect(themeButton).toHaveClass("public-nav-icon-button");
    expect(localeButton).toHaveClass("public-nav-icon-button", "public-nav-locale-trigger");
    expect(authLink).toHaveAttribute("href", "/login");
    expect(authLink).toHaveClass("public-nav-icon-button", "public-nav-auth-button");
    expect(screen.queryByText("English")).not.toBeInTheDocument();
    expect(screen.queryByText("中文")).not.toBeInTheDocument();
    expect(screen.queryByText("Log in")).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox", { name: "Search snippets" })).not.toBeInTheDocument();

    fireEvent.pointerEnter(searchButton);
    fireEvent.mouseEnter(searchButton);
    fireEvent.focus(searchButton);
    expect(screen.getByText("Search snippets")).toBeInTheDocument();
    fireEvent.mouseLeave(searchButton);

    fireEvent.pointerEnter(themeButton);
    fireEvent.mouseEnter(themeButton);
    fireEvent.focus(themeButton);
    expect(screen.getByText("Switch to light site mode")).toBeInTheDocument();
    fireEvent.mouseLeave(themeButton);

    fireEvent.click(localeButton);
    const menu = screen.getByRole("menu");
    expect(menu).toHaveClass("dropdown__menu");
    expect(menu.closest(".dropdown__popover")).not.toBeNull();
    expect(screen.getByText("English").closest(".menu-item")).not.toBeNull();
    expect(screen.getByText("中文").closest(".menu-item")).not.toBeNull();
  });

  it("calls the parent toggle handler and reflects the provided theme", () => {
    const onToggleTheme = vi.fn();
    renderNavbar("dark", onToggleTheme);

    const shell = screen.getByTestId("public-navbar-shell").closest("nav");
    const toggle = screen.getByRole("button", { name: "Switch to light site mode" });

    expect(shell).toHaveAttribute("data-theme", "dark");

    fireEvent.click(toggle);

    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it("renders the current light theme state", () => {
    renderNavbar("light");
    expect(screen.getByTestId("public-navbar-shell").closest("nav")).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Switch to dark site mode" })).toBeInTheDocument();
  });

  it("renders tooltips with the shared tooltip class in light theme", () => {
    renderNavbar("light");

    const themeButton = screen.getByRole("button", { name: "Switch to dark site mode" });

    fireEvent.pointerEnter(themeButton);
    fireEvent.mouseEnter(themeButton);
    fireEvent.focus(themeButton);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveClass("tooltip");
    expect(tooltip).toHaveTextContent("Switch to dark site mode");
  });

  it("switches the auth action to the account page when a session exists", () => {
    renderNavbar("dark", vi.fn(), {
      email: "builder@example.com",
      provider: "email",
      createdAt: "2026-04-18T00:00:00.000Z",
    });

    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute("href", "/account");
    expect(screen.getByRole("link", { name: "Account" })).toHaveClass("public-nav-icon-button", "public-nav-auth-button");
    expect(screen.queryByText("Account")).not.toBeInTheDocument();
  });
});
