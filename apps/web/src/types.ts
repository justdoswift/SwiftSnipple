export type ArticleStatus = "Draft" | "In Review" | "Scheduled" | "Published";

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  status: ArticleStatus;
  updatedAt: string;
  publishedAt: string | null;
}

export interface ArticlePayload {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  status: ArticleStatus;
  publishedAt: string | null;
}

export interface ArticleFormState {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string;
  coverImage: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  status: ArticleStatus;
  publishedAt: string;
}
