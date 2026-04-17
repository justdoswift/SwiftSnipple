import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MarkdownRenderer from "./MarkdownRenderer";

describe("MarkdownRenderer", () => {
  it("renders markdown structure and fenced code blocks", async () => {
    render(
      <MarkdownRenderer
        content={`# Example

This is **formatted** content.

\`\`\`swift
Text("Hello")
\`\`\``}
      />,
    );

    expect(screen.getByRole("heading", { name: "Example" })).toBeInTheDocument();
    expect(screen.getByText("formatted")).toBeInTheDocument();
    expect(await screen.findByText('Text("Hello")')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy code block" })).toBeInTheDocument();
  });
});
