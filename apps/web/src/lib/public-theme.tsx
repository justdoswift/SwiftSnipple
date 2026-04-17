import { createContext, useContext } from "react";

export type PublicTheme = "dark" | "light";

export const PUBLIC_THEME_STORAGE_KEY = "just-do-swift-public-theme";
const LEGACY_HEADER_THEME_STORAGE_KEY = "just-do-swift-header-theme";

export function readStoredPublicTheme(): PublicTheme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme =
    window.localStorage.getItem(PUBLIC_THEME_STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_HEADER_THEME_STORAGE_KEY);

  return storedTheme === "light" ? "light" : "dark";
}

export function getNextPublicTheme(theme: PublicTheme): PublicTheme {
  return theme === "dark" ? "light" : "dark";
}

export const PublicThemeContext = createContext<PublicTheme>("dark");

export function usePublicTheme() {
  return useContext(PublicThemeContext);
}
