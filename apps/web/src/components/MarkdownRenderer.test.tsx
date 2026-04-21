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

  it("renders linked markdown images without swallowing following content", () => {
    render(
      <MarkdownRenderer
        content={`## 1. Language Identification with \`NLLanguageRecognizer\`

[![Snippet 图片](/api/uploads/content-images/first.webp)](https://substackcdn.com/image/fetch/example-first)

**What it does:**
Tries to figure out what language a piece of text is in.

## 2. Robust Tokenization with \`NLTokenizer\`

[![Snippet 图片](/api/uploads/content-images/second.webp)](https://substackcdn.com/image/fetch/example-second)

**What it does:**
Breaks up text into words.`}
      />,
    );

    expect(screen.getByRole("heading", { name: /Language Identification/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Robust Tokenization/i })).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Snippet 图片" })).toHaveLength(2);
    expect(screen.getByText("Breaks up text into words.")).toBeInTheDocument();
  });
});
