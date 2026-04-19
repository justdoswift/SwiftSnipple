import { getLocalizedSnippetFields } from "./locale";
import type { AppLocale, Snippet } from "../types";

const SEARCH_RESULT_LIMIT = 8;
const SEARCH_PREVIEW_LENGTH = 140;

type SearchMatch = {
  score: number;
  previewSource: string;
};

export type PublicSearchResult = {
  snippet: Snippet;
  score: number;
  preview: string;
};

function normalizeValue(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function sanitizePreviewText(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`+/g, " ")
    .replace(/[#>*_[\]\-]/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPreview(value: string) {
  const sanitized = sanitizePreviewText(value);
  if (!sanitized) {
    return "";
  }

  return sanitized.length > SEARCH_PREVIEW_LENGTH
    ? `${sanitized.slice(0, SEARCH_PREVIEW_LENGTH).trimEnd()}…`
    : sanitized;
}

function getSearchableStrings(snippet: Snippet, locale: AppLocale) {
  const currentFields = getLocalizedSnippetFields(snippet, locale);
  const englishFields = snippet.locales?.en ? getLocalizedSnippetFields(snippet, "en") : currentFields;
  const chineseFields = snippet.locales?.zh ? getLocalizedSnippetFields(snippet, "zh") : currentFields;

  return {
    title: [currentFields.title, englishFields.title, chineseFields.title].filter(Boolean),
    slug: [currentFields.slug, englishFields.slug, chineseFields.slug, snippet.slug].filter(Boolean),
    excerpt: [currentFields.excerpt, englishFields.excerpt, chineseFields.excerpt, snippet.excerpt].filter(Boolean),
    category: [currentFields.category, englishFields.category, chineseFields.category, snippet.category].filter(Boolean),
    tags: [
      ...(currentFields.tags ?? []),
      ...(englishFields.tags ?? []),
      ...(chineseFields.tags ?? []),
      ...(snippet.tags ?? []),
    ].filter(Boolean),
    content: [currentFields.content, englishFields.content, chineseFields.content, snippet.content].filter(Boolean),
    prompts: [currentFields.prompts, englishFields.prompts, chineseFields.prompts, snippet.prompts].filter(Boolean),
    code: [snippet.code].filter(Boolean),
  };
}

function findMatch(snippet: Snippet, query: string, locale: AppLocale): SearchMatch | null {
  const normalizedQuery = normalizeValue(query);
  if (!normalizedQuery) {
    return null;
  }

  const searchables = getSearchableStrings(snippet, locale);
  let score = 0;
  let previewSource = "";

  const weightedFields: Array<[keyof typeof searchables, number]> = [
    ["title", 120],
    ["slug", 110],
    ["excerpt", 85],
    ["category", 80],
    ["tags", 70],
    ["content", 50],
    ["prompts", 45],
    ["code", 35],
  ];

  for (const [field, fieldScore] of weightedFields) {
    const values = searchables[field];
    const matchedValue = values.find((value) => normalizeValue(String(value)).includes(normalizedQuery));
    if (!matchedValue) {
      continue;
    }

    score += fieldScore;
    if (!previewSource) {
      previewSource = String(matchedValue);
    }
  }

  if (!score) {
    return null;
  }

  return { score, previewSource };
}

export function searchPublicSnippets(
  snippets: Snippet[],
  query: string,
  locale: AppLocale,
  limit = SEARCH_RESULT_LIMIT,
): PublicSearchResult[] {
  const normalizedQuery = normalizeValue(query);
  if (!normalizedQuery) {
    return [];
  }

  return snippets
    .filter((snippet) => snippet.status === "Published")
    .map((snippet) => {
      const match = findMatch(snippet, normalizedQuery, locale);
      if (!match) {
        return null;
      }

      const localizedFields = getLocalizedSnippetFields(snippet, locale);
      const preview = buildPreview(
        localizedFields.excerpt || match.previewSource || localizedFields.content || localizedFields.prompts || snippet.code,
      );

      return {
        snippet,
        score: match.score,
        preview,
      };
    })
    .filter((result): result is PublicSearchResult => result !== null)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return new Date(right.snippet.updatedAt).getTime() - new Date(left.snippet.updatedAt).getTime();
    })
    .slice(0, limit);
}
