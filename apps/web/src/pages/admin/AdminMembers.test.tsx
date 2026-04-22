import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminMembers from "./AdminMembers";
import { getAdminMembers } from "../../services/admin-members";
import type { AdminMember } from "../../types";

vi.mock("../../services/admin-members", () => ({
  getAdminMembers: vi.fn(),
}));

const mockedGetAdminMembers = vi.mocked(getAdminMembers);

const baseMember: AdminMember = {
  id: "member-1",
  email: "paid@example.com",
  createdAt: "2026-04-09T00:00:00.000Z",
  updatedAt: "2026-04-19T00:00:00.000Z",
  subscriptionStatus: "active",
  isPaid: true,
  currentPeriodEnd: "2026-05-09T00:00:00.000Z",
  cancelAtPeriodEnd: false,
};

describe("AdminMembers", () => {
  beforeEach(() => {
    mockedGetAdminMembers.mockReset();
  });

  it("shows the loading state before members resolve", () => {
    mockedGetAdminMembers.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <AdminMembers />
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading members...")).toBeInTheDocument();
  });

  it("shows a friendly empty state when there are no member accounts", async () => {
    mockedGetAdminMembers.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AdminMembers />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("No members yet")).toBeInTheDocument();
    });
  });

  it("shows request errors explicitly", async () => {
    mockedGetAdminMembers.mockRejectedValue(new Error("backend offline"));

    render(
      <MemoryRouter>
        <AdminMembers />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("backend offline")).toBeInTheDocument();
    });
  });

  it("renders member rows and summary counts after loading", async () => {
    mockedGetAdminMembers.mockResolvedValue([
      baseMember,
      {
        ...baseMember,
        id: "member-2",
        email: "free@example.com",
        subscriptionStatus: "inactive",
        isPaid: false,
        currentPeriodEnd: null,
      },
    ]);

    render(
      <MemoryRouter>
        <AdminMembers />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("paid@example.com")).toBeInTheDocument();
      expect(screen.getByText("free@example.com")).toBeInTheDocument();
    });

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(2);
  });

  it("filters member rows by email search query", async () => {
    mockedGetAdminMembers.mockResolvedValue([
      baseMember,
      {
        ...baseMember,
        id: "member-2",
        email: "free@example.com",
        subscriptionStatus: "inactive",
        isPaid: false,
        currentPeriodEnd: null,
      },
    ]);

    render(
      <MemoryRouter>
        <AdminMembers />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("paid@example.com")).toBeInTheDocument();
      expect(screen.getByText("free@example.com")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Search member email"), {
      target: { value: "free@" },
    });

    expect(screen.queryByText("paid@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("free@example.com")).toBeInTheDocument();
  });

  it("filters member rows by paid and free status", async () => {
    mockedGetAdminMembers.mockResolvedValue([
      baseMember,
      {
        ...baseMember,
        id: "member-2",
        email: "free@example.com",
        subscriptionStatus: "inactive",
        isPaid: false,
        currentPeriodEnd: null,
      },
    ]);

    render(
      <MemoryRouter>
        <AdminMembers />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("paid@example.com")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Type: All" }));
    const menu = await screen.findByRole("menu");
    fireEvent.click(within(menu).getByText("Type: Free"));

    expect(screen.queryByText("paid@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("free@example.com")).toBeInTheDocument();
  });
});
