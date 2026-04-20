import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccountPage from "./AccountPage";
import { createBillingPortalSession, createCheckoutSession } from "../services/member-auth";
import { createMemberSession } from "../test/factories";

vi.mock("../services/member-auth", () => ({
  createBillingPortalSession: vi.fn(),
  createCheckoutSession: vi.fn(),
}));

const mockedCreateCheckoutSession = vi.mocked(createCheckoutSession);
const mockedCreateBillingPortalSession = vi.mocked(createBillingPortalSession);

describe("AccountPage", () => {
  const originalLocation = window.location;
  let assignSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockedCreateCheckoutSession.mockReset();
    mockedCreateCheckoutSession.mockResolvedValue({ url: "https://stripe.test/checkout" });
    mockedCreateBillingPortalSession.mockReset();
    mockedCreateBillingPortalSession.mockResolvedValue({ url: "https://stripe.test/portal" });
    assignSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        assign: assignSpy,
      },
    });
  });

  it("renders a member center surface for a real member session", () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <AccountPage
          authSession={createMemberSession()}
          onSignOut={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    expect(screen.getByText("builder@example.com")).toBeInTheDocument();
    expect(screen.getByText("Not subscribed yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start subscription" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /publishing workspace/i })).not.toBeInTheDocument();
  });

  it("renders the empty member shell when there is no staged session", () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <AccountPage authSession={null} onSignOut={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Log in to manage your membership." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Login" })).toHaveAttribute("href", "/login");
  });

  it("lets the member sign out from the account page", () => {
    const onSignOut = vi.fn();

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <AccountPage authSession={createMemberSession()} onSignOut={onSignOut} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("starts checkout for inactive members", async () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <AccountPage authSession={createMemberSession()} onSignOut={vi.fn()} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Start subscription" }));

    await waitFor(() => {
      expect(mockedCreateCheckoutSession).toHaveBeenCalledTimes(1);
      expect(assignSpy).toHaveBeenCalledWith("https://stripe.test/checkout");
    });
  });

  it("opens billing portal when the member already has a billing account", async () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <AccountPage
          authSession={createMemberSession({
            isEntitled: true,
            subscriptionStatus: "active",
            currentPeriodEnd: "2026-05-18T00:00:00.000Z",
            hasBillingPortal: true,
          })}
          onSignOut={vi.fn()}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Manage billing" }));

    await waitFor(() => {
      expect(mockedCreateBillingPortalSession).toHaveBeenCalledTimes(1);
      expect(assignSpy).toHaveBeenCalledWith("https://stripe.test/portal");
    });
  });

  it("shows an ending-soon state when cancellation is scheduled at period end", () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <AccountPage
          authSession={createMemberSession({
            isEntitled: true,
            subscriptionStatus: "active",
            cancelAtPeriodEnd: true,
            currentPeriodEnd: "2026-05-20T00:00:00.000Z",
            hasBillingPortal: true,
          })}
          onSignOut={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Ends at current period end")).toBeInTheDocument();
    expect(screen.getByText("May 20, 2026")).toBeInTheDocument();
  });

  it("refreshes the member session after a successful checkout redirect", async () => {
    const onRefreshSession = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={["/account?checkout=success"]}>
        <AccountPage authSession={createMemberSession()} onSignOut={vi.fn()} onRefreshSession={onRefreshSession} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(onRefreshSession).toHaveBeenCalledTimes(1);
    });
  });
});
