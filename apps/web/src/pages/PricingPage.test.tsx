import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PricingPage from "./PricingPage";
import { LocaleContext } from "../lib/locale";
import { createCheckoutSession } from "../services/member-auth";
import { createMemberSession } from "../test/factories";

vi.mock("../services/member-auth", () => ({
  createCheckoutSession: vi.fn(),
}));

const mockedCreateCheckoutSession = vi.mocked(createCheckoutSession);

function renderPricingPage({
  locale = "en" as const,
  authSession = null,
}: {
  locale?: "en" | "zh";
  authSession?: ReturnType<typeof createMemberSession> | null;
} = {}) {
  return render(
    <LocaleContext.Provider value={{ locale }}>
      <MemoryRouter initialEntries={["/pricing"]}>
        <PricingPage authSession={authSession} />
      </MemoryRouter>
    </LocaleContext.Provider>,
  );
}

describe("PricingPage", () => {
  const originalLocation = window.location;
  let assignSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockedCreateCheckoutSession.mockReset();
    mockedCreateCheckoutSession.mockResolvedValue({ url: "https://stripe.test/checkout" });
    assignSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        assign: assignSpy,
      },
    });
  });

  it("renders the pricing page in english with the public plan details", () => {
    renderPricingPage();

    expect(screen.getByRole("heading", { name: "Choose the plan that fits your native SwiftUI workflow." })).toBeInTheDocument();
    expect(screen.getByText("$10")).toBeInTheDocument();
    expect(screen.getByText("per month")).toBeInTheDocument();
    expect(screen.getAllByText("Founding").length).toBeGreaterThan(0);
    expect(screen.getByText("$300")).toBeInTheDocument();
    expect(screen.queryByText("Enterprise")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Log in to subscribe" })).toHaveLength(3);
    expect(screen.getByText("All plans unlock the full library. Annual and Founding simply give you different commitment levels.")).toBeInTheDocument();
  });

  it("renders localized copy in chinese", () => {
    renderPricingPage({ locale: "zh" });

    expect(screen.getByRole("heading", { name: "选择适合您 SwiftUI 工作流的方案。" })).toBeInTheDocument();
    expect(screen.getByText("每月")).toBeInTheDocument();
    expect(screen.getByText("Founding 方案")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "登录后订阅" })).toHaveLength(3);
  });

  it("starts checkout for an authenticated member without a billing portal", async () => {
    renderPricingPage({ authSession: createMemberSession() });

    fireEvent.click(screen.getAllByRole("button", { name: "Choose plan" })[2]);

    await waitFor(() => {
      expect(mockedCreateCheckoutSession).toHaveBeenCalledWith("price_founding_default");
      expect(assignSpy).toHaveBeenCalledWith("https://stripe.test/checkout");
    });
  });

  it("sends returning members to the account page", () => {
    renderPricingPage({
      authSession: createMemberSession({
        isEntitled: true,
        subscriptionStatus: "active",
        hasBillingPortal: true,
      }),
    });

    expect(screen.getAllByRole("link", { name: "Open member center" })).toHaveLength(3);
    expect(screen.getAllByRole("link", { name: "Open member center" })[0]).toHaveAttribute("href", "/account");
  });
});
