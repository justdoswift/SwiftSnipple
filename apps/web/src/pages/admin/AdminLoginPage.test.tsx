import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { PublicThemeContext } from "../../lib/public-theme";
import { loginAdmin } from "../../services/admin-auth";
import AdminLoginPage from "./AdminLoginPage";

vi.mock("../../services/admin-auth", () => ({
  loginAdmin: vi.fn(),
}));

const mockedLoginAdmin = vi.mocked(loginAdmin);

function renderAdminLoginPage() {
  const onAuthenticate = vi.fn();

  render(
    <PublicThemeContext.Provider value="dark">
      <MemoryRouter initialEntries={["/en/admin/login"]}>
        <Routes>
          <Route path="/en/admin/login" element={<AdminLoginPage authSession={null} onAuthenticate={onAuthenticate} />} />
          <Route path="/en/admin" element={<div>creator workspace route</div>} />
        </Routes>
      </MemoryRouter>
    </PublicThemeContext.Provider>,
  );

  return { onAuthenticate };
}

describe("AdminLoginPage", () => {
  it("renders creator workspace login language", () => {
    renderAdminLoginPage();

    const brandShell = screen.getByRole("banner");
    expect(brandShell).toHaveClass("w-full", "px-4", "md:px-6", "lg:px-8");
    expect(brandShell).not.toHaveClass("mx-auto", "max-w-[1400px]");
    expect(screen.getByRole("heading", { name: "Creator Log In" })).toBeInTheDocument();
    expect(screen.getByText("Creator Workspace")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter Creator Workspace" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue with Google" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue with GitHub" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to public collection" })).toHaveAttribute("href", "/en");
  });

  it("submits email auth into the creator workspace", async () => {
    const { onAuthenticate } = renderAdminLoginPage();
    mockedLoginAdmin.mockResolvedValue({
      email: "creator@example.com",
      provider: "email",
      createdAt: "2026-04-19T00:00:00.000Z",
    });

    fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "creator@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret12" } });
    fireEvent.click(screen.getByRole("button", { name: "Enter Creator Workspace" }));

    await waitFor(() => {
      expect(mockedLoginAdmin).toHaveBeenCalledWith({
        email: "creator@example.com",
        password: "secret12",
      });
    });
    await waitFor(() => {
      expect(onAuthenticate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "creator@example.com",
          provider: "email",
        }),
      );
    });
    expect(await screen.findByText("creator workspace route")).toBeInTheDocument();
  });

  it("shows API login errors", async () => {
    renderAdminLoginPage();
    mockedLoginAdmin.mockRejectedValue(new Error("invalid credentials"));

    fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "creator@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong-pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Enter Creator Workspace" }));

    expect(await screen.findByText("invalid credentials")).toBeInTheDocument();
  });
});
