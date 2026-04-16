export type SnippetStatus = "Draft" | "In Review" | "Scheduled" | "Published";

export interface Snippet {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage: string;
  content: string;
  code: string;
  prompts: string;
  seoTitle: string;
  seoDescription: string;
  status: SnippetStatus;
  updatedAt: string;
  publishedAt: string | null;
}

export interface SnippetPayload {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage: string;
  content: string;
  code: string;
  prompts: string;
  seoTitle: string;
  seoDescription: string;
  status: SnippetStatus;
  publishedAt: string | null;
}

export interface SnippetFormState {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string;
  coverImage: string;
  content: string;
  code: string;
  prompts: string;
  seoTitle: string;
  seoDescription: string;
  status: SnippetStatus;
  publishedAt: string;
}

export type ArticleStatus = SnippetStatus;
export type Article = Snippet;
export type ArticlePayload = SnippetPayload;
export type ArticleFormState = SnippetFormState;
