export type SnippetStatus = "Draft" | "In Review" | "Scheduled" | "Published";
export type AppLocale = "en" | "zh";

export interface SnippetLocalizedFields {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  content: string;
  prompts: string;
  seoTitle: string;
  seoDescription: string;
}

export interface SnippetLocalizedFieldsInput extends Omit<SnippetLocalizedFields, "tags"> {
  tags: string;
}

export interface SnippetLocales<T> {
  en: T;
  zh: T;
}

export interface Snippet {
  id: string;
  coverImage: string;
  code: string;
  status: SnippetStatus;
  updatedAt: string;
  publishedAt: string | null;
  locales?: SnippetLocales<SnippetLocalizedFields>;
  title?: string;
  slug?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  content?: string;
  prompts?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface SnippetPayload {
  coverImage: string;
  code: string;
  status: SnippetStatus;
  publishedAt: string | null;
  locales: SnippetLocales<SnippetLocalizedFields>;
}

export interface SnippetFormState {
  coverImage: string;
  code: string;
  status: SnippetStatus;
  publishedAt: string;
  locales: SnippetLocales<SnippetLocalizedFieldsInput>;
}

export type ArticleStatus = SnippetStatus;
export type Article = Snippet;
export type ArticlePayload = SnippetPayload;
export type ArticleFormState = SnippetFormState;
