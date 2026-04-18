import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";
import { PublicThemeContext } from "../lib/public-theme";

function renderLoginPage() {
  const onAuthenticate = vi.fn();

  render(
    <PublicThemeContext.Provider value="dark">
      <MemoryRouter initialEntries={["/en/login"]}>
        <Routes>
          <Route path="/en/login" element={<LoginPage authSession={null} onAuthenticate={onAuthenticate} />} />
          <Route path="/en/account" element={<div>member center route</div>} />
        </Routes>
      </MemoryRouter>
    </PublicThemeContext.Provider>,
  );

  return { onAuthenticate };
}

describe("LoginPage", () => {
  it("renders the login mode by default", () => {
    renderLoginPage();

    expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
    expect(screen.queryByText("Member Access")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Enter the snippet library shell with a UI-only account flow. No live auth infrastructure is wired yet."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Back to the public collection")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Show password")).toBeInTheDocument();
    expect(screen.getByLabelText("Remember me")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Forgot password?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with GitHub" })).toBeInTheDocument();
  });

  it("switches to sign-up mode inside the same auth card", () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(screen.getByRole("heading", { name: "Sign Up" })).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
  });

  it("simulates a successful email login and routes to the member center", () => {
    const { onAuthenticate } = renderLoginPage();

    fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "builder@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret12" } });
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(onAuthenticate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "builder@example.com",
        provider: "email",
      }),
      true,
    );
    expect(screen.getByText("member center route")).toBeInTheDocument();
  });
});
