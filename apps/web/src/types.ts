export type SnippetStatus = "Draft" | "Published";
export type AppLocale = "en" | "zh";
export type SnippetAccessLevel = "teaser" | "full";
export type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

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

export interface SnippetAvailableLocales {
  en: boolean;
  zh: boolean;
}

export interface Snippet {
  id: string;
  coverImage: string;
  code: string;
  status: SnippetStatus;
  updatedAt: string;
  publishedAt: string | null;
  requiresSubscription: boolean;
  viewerCanAccess: boolean;
  locked: boolean;
  accessLevel: SnippetAccessLevel;
  availableLocales?: SnippetAvailableLocales;
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
  requiresSubscription: boolean;
  locales: SnippetLocales<SnippetLocalizedFields>;
}

export interface SnippetFormState {
  coverImage: string;
  code: string;
  status: SnippetStatus;
  publishedAt: string;
  requiresSubscription: boolean;
  locales: SnippetLocales<SnippetLocalizedFieldsInput>;
}

export interface MemberSession {
  email: string;
  isAuthenticated: boolean;
  subscriptionStatus: SubscriptionStatus;
  isEntitled: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasBillingPortal: boolean;
}

export type ArticleStatus = SnippetStatus;
export type Article = Snippet;
export type ArticlePayload = SnippetPayload;
export type ArticleFormState = SnippetFormState;
