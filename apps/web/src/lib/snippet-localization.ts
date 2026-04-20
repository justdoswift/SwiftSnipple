import type {
  AppLocale,
  Snippet,
  SnippetAvailableLocales,
  SnippetFormState,
  SnippetLocalizedFields,
  SnippetLocalizedFieldsInput,
} from "../types";

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
  if (snippet.locales) {
    return coerceLocalizedSnippetFields(snippet.locales[locale]);
  }

  const localizedFields = snippet.locales?.[locale];
  if (localizedFields) {
    return coerceLocalizedSnippetFields(localizedFields);
  }

  return coerceLocalizedSnippetFields(snippet as unknown as LegacySnippetFields);
}

export function getFormLocale(form: SnippetFormState, locale: AppLocale): SnippetLocalizedFieldsInput {
  return form.locales[locale];
}

function hasRenderableLocalizedValue(fields: SnippetLocalizedFields) {
  return Boolean(
    fields.title.trim() ||
      fields.slug.trim() ||
      fields.excerpt.trim() ||
      fields.content.trim() ||
      fields.prompts.trim() ||
      fields.seoTitle.trim() ||
      fields.seoDescription.trim() ||
      fields.tags.length,
  );
}

export function getAvailableSnippetLocales(snippet: Snippet): SnippetAvailableLocales {
  if (snippet.availableLocales) {
    return snippet.availableLocales;
  }

  const en = snippet.locales?.en ? coerceLocalizedSnippetFields(snippet.locales.en) : coerceLocalizedSnippetFields();
  const zh = snippet.locales?.zh ? coerceLocalizedSnippetFields(snippet.locales.zh) : coerceLocalizedSnippetFields();

  return {
    en: hasRenderableLocalizedValue(en),
    zh: hasRenderableLocalizedValue(zh),
  };
}

export function isSnippetLocaleAvailable(snippet: Snippet, locale: AppLocale) {
  return getAvailableSnippetLocales(snippet)[locale];
}

export function getSnippetRouteSlug(snippet: Snippet, locale: AppLocale) {
  const locales = getAvailableSnippetLocales(snippet);
  const currentFields = getSnippetLocale(snippet, locale);
  if (locales[locale] && currentFields.slug.trim()) {
    return currentFields.slug;
  }

  const fallbackLocale: AppLocale = locale === "en" ? "zh" : "en";
  const fallbackFields = getSnippetLocale(snippet, fallbackLocale);
  if (locales[fallbackLocale] && fallbackFields.slug.trim()) {
    return fallbackFields.slug;
  }

  return currentFields.slug.trim() || fallbackFields.slug.trim();
}
