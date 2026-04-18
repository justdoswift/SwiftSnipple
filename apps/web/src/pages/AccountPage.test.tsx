import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AccountPage from "./AccountPage";

describe("AccountPage", () => {
  it("renders a member center surface for a staged session", () => {
    render(
      <MemoryRouter initialEntries={["/en/account"]}>
        <AccountPage
          authSession={{
            email: "builder@example.com",
            provider: "google",
            createdAt: "2026-04-18T00:00:00.000Z",
          }}
          onSignOut={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("builder@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /publishing workspace/i })).toHaveAttribute("href", "/en/admin");
    expect(screen.queryByText("Admin Console")).not.toBeInTheDocument();
  });

  it("renders the empty member shell when there is no staged session", () => {
    render(
      <MemoryRouter initialEntries={["/en/account"]}>
        <AccountPage authSession={null} onSignOut={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("No staged member session yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Login" })).toHaveAttribute("href", "/en/login");
  });

  it("lets the member sign out from the account page", () => {
    const onSignOut = vi.fn();

    render(
      <MemoryRouter initialEntries={["/en/account"]}>
        <AccountPage
          authSession={{
            email: "builder@example.com",
            provider: "github",
            createdAt: "2026-04-18T00:00:00.000Z",
          }}
          onSignOut={onSignOut}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
