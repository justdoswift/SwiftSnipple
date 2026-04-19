import type { MemberSession, Snippet, SnippetLocalizedFields } from "../types";

type PartialLocalizedFields = Partial<SnippetLocalizedFields>;

function createLocalizedFields(overrides?: PartialLocalizedFields): SnippetLocalizedFields {
  return {
    title: "Glass Navigation",
    slug: "glass-navigation",
    excerpt: "A polished snippet preview.",
    category: "Navigation",
    tags: ["SwiftUI"],
    content: "# Notes\n\nA polished snippet preview.",
    prompts: "Build a polished navigation snippet.",
    seoTitle: "Glass Navigation",
    seoDescription: "SEO copy",
    ...overrides,
  };
}

export function createSnippet(overrides?: Partial<Snippet>): Snippet {
  const localizedOverrideFields: PartialLocalizedFields = {
    title: overrides?.title,
    slug: overrides?.slug,
    excerpt: overrides?.excerpt,
    category: overrides?.category,
    tags: overrides?.tags,
    content: overrides?.content,
    prompts: overrides?.prompts,
    seoTitle: overrides?.seoTitle,
    seoDescription: overrides?.seoDescription,
  };
  const locales = overrides?.locales ?? {
    en: createLocalizedFields(localizedOverrideFields),
    zh: createLocalizedFields({
      title: "玻璃导航",
      slug: "bo-li-dao-hang",
      excerpt: "一个精致的 snippet 预览。",
      category: "导航",
      content: "# 笔记\n\n一个精致的 snippet 预览。",
      prompts: "构建一个精致的导航 snippet。",
      seoTitle: "玻璃导航",
    }),
  };

  const fallbackFields = locales.en;

  return {
    id: "snippet-1",
    coverImage: "https://example.com/cover.jpg",
    code: 'Text("Hello")',
    status: "Published",
    updatedAt: "2026-04-09T12:00:00.000Z",
    publishedAt: "2026-04-09T12:00:00.000Z",
    requiresSubscription: false,
    viewerCanAccess: true,
    locked: false,
    accessLevel: "full",
    locales,
    title: fallbackFields.title,
    slug: fallbackFields.slug,
    excerpt: fallbackFields.excerpt,
    category: fallbackFields.category,
    tags: fallbackFields.tags,
    content: fallbackFields.content,
    prompts: fallbackFields.prompts,
    seoTitle: fallbackFields.seoTitle,
    seoDescription: fallbackFields.seoDescription,
    ...overrides,
  };
}

export function createMemberSession(overrides?: Partial<MemberSession>): MemberSession {
  return {
    email: "builder@example.com",
    isAuthenticated: true,
    subscriptionStatus: "inactive",
    isEntitled: false,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    hasBillingPortal: false,
    ...overrides,
  };
}
