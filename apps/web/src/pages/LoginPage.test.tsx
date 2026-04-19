import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";
import { PublicThemeContext } from "../lib/public-theme";
import { loginMember, signupMember } from "../services/member-auth";
import { createMemberSession } from "../test/factories";

vi.mock("../services/member-auth", () => ({
  loginMember: vi.fn(),
  signupMember: vi.fn(),
}));

const mockedLoginMember = vi.mocked(loginMember);
const mockedSignupMember = vi.mocked(signupMember);

function renderLoginPage() {
  const onAuthenticate = vi.fn();

  render(
    <PublicThemeContext.Provider value="dark">
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage authSession={null} onAuthenticate={onAuthenticate} />} />
          <Route path="/account" element={<div>member center route</div>} />
        </Routes>
      </MemoryRouter>
    </PublicThemeContext.Provider>,
  );

  return { onAuthenticate };
}

describe("LoginPage", () => {
  beforeEach(() => {
    mockedLoginMember.mockReset();
    mockedLoginMember.mockResolvedValue(createMemberSession());
    mockedSignupMember.mockReset();
    mockedSignupMember.mockResolvedValue(createMemberSession({ email: "new-builder@example.com" }));
  });

  it("renders the login mode by default", () => {
    renderLoginPage();

    const brandShell = screen.getByRole("banner");
    expect(brandShell).toHaveClass("w-full", "px-4", "md:px-6", "lg:px-8");
    expect(brandShell).not.toHaveClass("mx-auto", "max-w-[1400px]");
    expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
    expect(screen.queryByText("Member Access")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Enter the snippet library shell with a UI-only account flow. No live auth infrastructure is wired yet."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Back to the public collection")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Show password")).toBeInTheDocument();
    expect(screen.queryByLabelText("Remember me")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Forgot password?" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue with Google" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue with GitHub" })).not.toBeInTheDocument();
  });

  it("switches to sign-up mode inside the same auth card", () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(screen.getByRole("heading", { name: "Sign Up" })).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
  });

  it("logs in with the member API and routes to the member center", async () => {
    const { onAuthenticate } = renderLoginPage();

    fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "builder@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret12" } });
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(mockedLoginMember).toHaveBeenCalledWith({
        email: "builder@example.com",
        password: "secret12",
      });
    });
    expect(onAuthenticate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "builder@example.com",
        isAuthenticated: true,
      }),
    );
    expect(await screen.findByText("member center route")).toBeInTheDocument();
  });

  it("creates a member account in sign-up mode", async () => {
    const { onAuthenticate } = renderLoginPage();

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));
    fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "new-builder@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret12" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "secret12" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mockedSignupMember).toHaveBeenCalledWith({
        email: "new-builder@example.com",
        password: "secret12",
      });
    });
    expect(onAuthenticate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new-builder@example.com",
        isAuthenticated: true,
      }),
    );
  });
});
