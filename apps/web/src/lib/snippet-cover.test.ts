import { describe, expect, it } from "vitest";
import { resolveSnippetCoverImage } from "./snippet-cover";

describe("resolveSnippetCoverImage", () => {
  it("falls back to the other theme cover before legacy cover", () => {
    expect(
      resolveSnippetCoverImage(
        {
          coverImage: "/legacy-cover.jpg",
          coverImageDark: "",
          coverImageLight: "/light-cover.jpg",
        },
        "dark",
      ),
    ).toBe("/light-cover.jpg");
    expect(
      resolveSnippetCoverImage(
        {
          coverImage: "/legacy-cover.jpg",
          coverImageDark: "/dark-cover.jpg",
          coverImageLight: "",
        },
        "light",
      ),
    ).toBe("/dark-cover.jpg");
  });

  it("prefers the matching theme-specific cover when available", () => {
    const snippet = {
      coverImage: "/legacy-cover.jpg",
      coverImageDark: "/dark-cover.jpg",
      coverImageLight: "/light-cover.jpg",
    };

    expect(resolveSnippetCoverImage(snippet, "dark")).toBe("/dark-cover.jpg");
    expect(resolveSnippetCoverImage(snippet, "light")).toBe("/light-cover.jpg");
  });

  it("falls back to the legacy cover when both theme covers are missing", () => {
    expect(
      resolveSnippetCoverImage(
        {
          coverImage: "/legacy-cover.jpg",
          coverImageDark: "",
          coverImageLight: "",
        },
        "dark",
      ),
    ).toBe("/legacy-cover.jpg");
  });
});
