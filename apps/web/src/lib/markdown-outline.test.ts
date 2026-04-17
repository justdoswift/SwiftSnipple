import { describe, expect, it } from "vitest";
import { extractMarkdownOutline } from "./markdown-outline";

describe("extractMarkdownOutline", () => {
  it("extracts h2 and h3 headings with stable ids", () => {
    const outline = extractMarkdownOutline(`# Title

## First stop

### A child heading

## First stop
`);

    expect(outline).toEqual([
      { id: "first-stop", text: "First stop", level: 2 },
      { id: "a-child-heading", text: "A child heading", level: 3 },
      { id: "first-stop-2", text: "First stop", level: 2 },
    ]);
  });

  it("ignores headings inside fenced code blocks", () => {
    const outline = extractMarkdownOutline(`## Visible

\`\`\`md
## Hidden
\`\`\`

### Also visible
`);

    expect(outline).toEqual([
      { id: "visible", text: "Visible", level: 2 },
      { id: "also-visible", text: "Also visible", level: 3 },
    ]);
  });
});
