import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HighlightedCodeBlock from "./HighlightedCodeBlock";
import { PublicThemeContext } from "../lib/public-theme";
import { highlightMarkdownCode } from "../lib/markdown-highlighter";

vi.mock("../lib/markdown-highlighter", () => ({
  highlightMarkdownCode: vi.fn(async (code: string) => `<pre class="shiki"><code>${code}</code></pre>`),
  resolveMarkdownLanguage: vi.fn((language?: string | null) => language ?? null),
}));

describe("HighlightedCodeBlock", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("copies code and resets back to idle", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <HighlightedCodeBlock
        code={`Text("Hello")`}
        language="swift"
        copyable
        copyLabel="Swift code"
        className="snippet-highlight"
        fallbackClassName="type-code-block"
      />,
    );

    const button = screen.getByRole("button", { name: "Copy Swift code" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`Text("Hello")`);
      expect(button).toHaveAttribute("data-copy-state", "copied");
    });

    await waitFor(() => {
      expect(button).toHaveAttribute("data-copy-state", "idle");
    }, { timeout: 2500 });
  });

  it("shows a failed state when clipboard copy throws", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard unavailable"));
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <HighlightedCodeBlock
        code={`Text("Hello")`}
        language="swift"
        copyable
        copyLabel="Swift code"
        className="snippet-highlight"
        fallbackClassName="type-code-block"
      />,
    );

    const button = screen.getByRole("button", { name: "Copy Swift code" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`Text("Hello")`);
      expect(button).toHaveAttribute("data-copy-state", "failed");
    });
  });

  it("uses the active public theme for highlighting", async () => {
    render(
      <PublicThemeContext.Provider value="light">
        <HighlightedCodeBlock
          code={`Text("Hello")`}
          language="swift"
          copyable
          copyLabel="Swift code"
          className="snippet-highlight"
          fallbackClassName="type-code-block"
        />
      </PublicThemeContext.Provider>,
    );

    await waitFor(() => {
      expect(highlightMarkdownCode).toHaveBeenCalledWith(`Text("Hello")`, "swift", "light");
    });
  });
});
