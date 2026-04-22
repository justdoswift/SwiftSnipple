import type { PublicTheme } from "./public-theme";
import type { Snippet } from "../types";

export function resolveSnippetCoverImage(
  snippet: Pick<Snippet, "coverImage" | "coverImageDark" | "coverImageLight">,
  theme: PublicTheme,
) {
  if (theme === "light") {
    return snippet.coverImageLight || snippet.coverImageDark || snippet.coverImage;
  }

  return snippet.coverImageDark || snippet.coverImageLight || snippet.coverImage;
}
