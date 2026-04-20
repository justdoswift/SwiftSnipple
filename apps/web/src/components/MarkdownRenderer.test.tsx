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

  it("renders markdown images and custom video blocks", () => {
    render(
      <MarkdownRenderer
        content={`![Hero](/api/uploads/content-images/example.png)

::video{src="/api/uploads/content-videos/demo.mp4" title="Demo video"}`}
      />,
    );

    expect(screen.getByRole("img", { name: "Hero" })).toHaveAttribute("src", "/api/uploads/content-images/example.png");
    expect(screen.getByText("Demo video")).toBeInTheDocument();
    expect(screen.getByText("Demo video").closest("figure")?.querySelector("video")).not.toBeNull();
  });
});
