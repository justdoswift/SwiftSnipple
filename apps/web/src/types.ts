export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Low" | "Medium" | "High";
  fidelity: string;
  buildTime: string;
  source: {
    name: string;
    url: string;
  };
  featured?: boolean;
  image: string;
  recreationImage: string;
  techniques: string[];
  processNotes: string;
  simplificationNotes: string;
  keyDecisions: string;
  reusablePattern: string;
  codeSnippet: string;
  prompt: string;
}

export interface MiniCaseStudy {
  id: string;
  title: string;
  category: string;
  image: string;
}

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
