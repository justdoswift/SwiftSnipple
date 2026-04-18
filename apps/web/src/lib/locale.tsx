import { createContext, useContext } from "react";
import type { AppLocale, Snippet, SnippetLocalizedFields } from "../types";
import { coerceLocalizedSnippetFields } from "./snippet-localization";

export const LOCALE_STORAGE_KEY = "just-do-swift-locale";
export const DEFAULT_LOCALE: AppLocale = "en";

export type AppLocaleOption = {
  code: AppLocale;
  nativeLabel: string;
  matchPrefixes: string[];
};

export const APP_LOCALE_OPTIONS = [
  {
    code: "en",
    nativeLabel: "English",
    matchPrefixes: ["en"],
  },
  {
    code: "zh",
    nativeLabel: "中文",
    matchPrefixes: ["zh"],
  },
] satisfies AppLocaleOption[];

export const APP_LOCALES: AppLocale[] = APP_LOCALE_OPTIONS.map((option) => option.code);

type LocaleContextValue = {
  locale: AppLocale;
  setLocale?: (locale: AppLocale) => void;
};

export const LocaleContext = createContext<LocaleContextValue>({ locale: DEFAULT_LOCALE });

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale);
}

export function getLocaleOption(locale: AppLocale) {
  return APP_LOCALE_OPTIONS.find((option) => option.code === locale) ?? APP_LOCALE_OPTIONS[0];
}

export function detectPreferredLocale(): AppLocale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const browserLanguages = window.navigator.languages?.length
    ? window.navigator.languages
    : [window.navigator.language];

  for (const browserLanguage of browserLanguages) {
    const normalizedLanguage = browserLanguage.toLowerCase();
    const matchedLocale = APP_LOCALE_OPTIONS.find((option) =>
      option.matchPrefixes.some((prefix) => normalizedLanguage.startsWith(prefix.toLowerCase())),
    );

    if (matchedLocale) {
      return matchedLocale.code;
    }
  }

  return DEFAULT_LOCALE;
}

export function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isAppLocale(storedLocale)) {
    return storedLocale;
  }

  return detectPreferredLocale();
}

export function writeStoredLocale(locale: AppLocale) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function localizePath(locale: AppLocale, path = "/") {
  const normalizedPath = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/") {
    return `/${locale}`;
  }

  return `/${locale}${normalizedPath}`;
}

export function stripLocalePrefix(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) {
    return "/";
  }

  if (!isAppLocale(segments[0])) {
    return pathname || "/";
  }

  const remainingPath = segments.slice(1).join("/");
  return remainingPath ? `/${remainingPath}` : "/";
}

export function switchLocalePath(pathname: string, locale: AppLocale) {
  return localizePath(locale, stripLocalePrefix(pathname));
}

export function getLocalizedSnippetFields(snippet: Snippet, locale: AppLocale): SnippetLocalizedFields {
  const localizedFields = snippet.locales?.[locale];
  if (localizedFields) {
    return coerceLocalizedSnippetFields(localizedFields);
  }

  return coerceLocalizedSnippetFields(snippet as unknown as Partial<SnippetLocalizedFields>);
}

export function getLocalizedSnippetPath(locale: AppLocale, snippet: Snippet) {
  return localizePath(locale, `/snippets/${getLocalizedSnippetFields(snippet, locale).slug}`);
}

export function useAppLocale() {
  return useContext(LocaleContext);
}
