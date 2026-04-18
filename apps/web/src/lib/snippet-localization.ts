import type { AppLocale, Snippet, SnippetFormState, SnippetLocalizedFields, SnippetLocalizedFieldsInput } from "../types";

export function createEmptyLocalizedFields(): SnippetLocalizedFields {
  return {
    title: "",
    slug: "",
    excerpt: "",
    category: "Workflow",
    tags: [],
    content: "",
    prompts: "",
    seoTitle: "",
    seoDescription: "",
  };
}

export function createEmptyLocalizedInputFields(): SnippetLocalizedFieldsInput {
  return {
    title: "",
    slug: "",
    excerpt: "",
    category: "Workflow",
    tags: "",
    content: "",
    prompts: "",
    seoTitle: "",
    seoDescription: "",
  };
}

type LegacySnippetFields = Partial<SnippetLocalizedFields> & {
  title?: string;
  slug?: string;
  excerpt?: string;
  category?: string;
  tags?: string[] | string;
  content?: string;
  prompts?: string;
  seoTitle?: string;
  seoDescription?: string;
};

function normalizeTags(tags: string[] | string | undefined) {
  if (Array.isArray(tags)) {
    return tags.filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

export function coerceLocalizedSnippetFields(source?: LegacySnippetFields | null): SnippetLocalizedFields {
  return {
    title: source?.title ?? "",
    slug: source?.slug ?? "",
    excerpt: source?.excerpt ?? "",
    category: source?.category ?? "Workflow",
    tags: normalizeTags(source?.tags),
    content: source?.content ?? "",
    prompts: source?.prompts ?? "",
    seoTitle: source?.seoTitle ?? "",
    seoDescription: source?.seoDescription ?? "",
  };
}

export function getSnippetLocale(snippet: Snippet, locale: AppLocale): SnippetLocalizedFields {
  const localizedFields = snippet.locales?.[locale];
  if (localizedFields) {
    return coerceLocalizedSnippetFields(localizedFields);
  }

  return coerceLocalizedSnippetFields(snippet as unknown as LegacySnippetFields);
}

export function getFormLocale(form: SnippetFormState, locale: AppLocale): SnippetLocalizedFieldsInput {
  return form.locales[locale];
}
