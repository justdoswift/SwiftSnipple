import { describe, expect, it } from "vitest";
import { searchPublicSnippets } from "./public-search";
import type { Snippet } from "../types";
import { createSnippet } from "../test/factories";

const baseSnippet: Snippet = createSnippet({
  coverImage: "/cover.jpg",
  code: "withAnimation(.spring())",
  updatedAt: "2026-04-19T10:00:00.000Z",
  publishedAt: "2026-04-19T10:00:00.000Z",
  locales: {
    en: {
      title: "Glass Navigation",
      slug: "glass-navigation",
      excerpt: "A polished navigation pattern.",
      category: "Navigation",
      tags: ["SwiftUI"],
      content: "Build a glass navigation shell with motion and hierarchy.",
      prompts: "Create a smooth navigation prototype.",
      seoTitle: "Glass Navigation",
      seoDescription: "SEO copy",
    },
    zh: {
      title: "玻璃导航",
      slug: "boli-daohang",
      excerpt: "一个精致的导航模式。",
      category: "导航",
      tags: ["SwiftUI"],
      content: "构建一个带有动效层次的玻璃导航外壳。",
      prompts: "创建一个顺滑的导航原型。",
      seoTitle: "玻璃导航",
      seoDescription: "SEO copy",
    },
  },
});

describe("searchPublicSnippets", () => {
  it("returns no results for an empty query", () => {
    expect(searchPublicSnippets([baseSnippet], "", "en")).toEqual([]);
  });

  it("ranks title and slug matches ahead of body matches", () => {
    const bodyMatch: Snippet = {
      ...baseSnippet,
      id: "snippet-2",
      updatedAt: "2026-04-19T12:00:00.000Z",
      locales: {
        en: {
          ...baseSnippet.locales!.en,
          title: "Adaptive Layout",
          slug: "adaptive-layout",
          excerpt: "Layout tuning.",
          content: "This implementation references glass navigation in the write-up only.",
        },
        zh: {
          ...baseSnippet.locales!.zh,
          title: "自适应布局",
          slug: "zishiying-buju",
          excerpt: "布局调优。",
          content: "正文里提到玻璃导航，但不是标题。",
        },
      },
    };

    const results = searchPublicSnippets([bodyMatch, baseSnippet], "glass", "en");
    expect(results.map((result) => result.snippet.id)).toEqual(["snippet-1", "snippet-2"]);
  });

  it("searches prompts and code while excluding draft snippets", () => {
    const promptMatch: Snippet = {
      ...baseSnippet,
      id: "snippet-3",
      locales: {
        en: {
          ...baseSnippet.locales!.en,
          title: "Prompt Driven",
          slug: "prompt-driven",
          prompts: "A motion-heavy workflow for advanced search recall.",
        },
        zh: {
          ...baseSnippet.locales!.zh,
          title: "提示词驱动",
          slug: "tishici-qudong",
          prompts: "一个用于高级搜索召回的动效工作流。",
        },
      },
    };

    const draftMatch: Snippet = {
      ...baseSnippet,
      id: "snippet-4",
      status: "Draft",
      locales: {
        en: {
          ...baseSnippet.locales!.en,
          title: "Draft Search Match",
          slug: "draft-search-match",
        },
        zh: {
          ...baseSnippet.locales!.zh,
          title: "草稿命中",
          slug: "caogao-mingzhong",
        },
      },
    };

    const results = searchPublicSnippets([draftMatch, promptMatch], "search", "en");
    expect(results.map((result) => result.snippet.id)).toEqual(["snippet-3"]);
  });

  it("does not search locked code or prompts", () => {
    const lockedSnippet = createSnippet({
      id: "snippet-locked",
      requiresSubscription: true,
      viewerCanAccess: false,
      locked: true,
      accessLevel: "teaser",
      code: "premiumSearchNeedle()",
      prompts: "premium search phrase",
      locales: {
        en: {
          ...baseSnippet.locales!.en,
          title: "Premium Flow",
          slug: "premium-flow",
          excerpt: "Visible teaser copy.",
          content: "",
          prompts: "",
        },
        zh: {
          ...baseSnippet.locales!.zh,
          title: "订阅流程",
          slug: "dingyue-liucheng",
          excerpt: "可见的 teaser 文案。",
          content: "",
          prompts: "",
        },
      },
    });

    expect(searchPublicSnippets([lockedSnippet], "premium search phrase", "en")).toEqual([]);
    expect(searchPublicSnippets([lockedSnippet], "premiumSearchNeedle", "en")).toEqual([]);
  });
});
