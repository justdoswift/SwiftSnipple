import { Article } from "../types";

export const INITIAL_ARTICLES: Article[] = [
  {
    id: "swiftui-ios26-glass-panels",
    title: "Designing Editorial Glass Panels for iOS 26",
    slug: "designing-editorial-glass-panels-ios-26",
    excerpt:
      "A field note on turning spatial glass treatments into stable SwiftUI building blocks without losing editorial sharpness.",
    category: "Design Systems",
    tags: ["SwiftUI", "Liquid Glass", "Editorial UI"],
    coverImage:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    content: `# Designing Editorial Glass Panels for iOS 26

SwiftUI can feel sterile when every glass card looks identical. The goal here is to make the material system feel *edited*, not auto-generated.

## What we kept

- oversized headlines with strict line lengths
- low-contrast dividers instead of heavy card chrome
- a restrained palette that lets motion do the talking

## Implementation notes

Use one shared surface recipe for the shell, then vary hierarchy with spacing and typography before adding more blur.

\`\`\`swift
RoundedRectangle(cornerRadius: 28, style: .continuous)
  .fill(.ultraThinMaterial)
  .overlay(Color.white.opacity(0.08))
\`\`\`

## Shipping checklist

- test legibility on bright photography
- reduce nested blur layers
- keep shadows soft and editorial`,
    seoTitle: "Designing Editorial Glass Panels for iOS 26",
    seoDescription:
      "Learn how to translate high-end editorial glass treatments into production-minded SwiftUI patterns.",
    status: "Published",
    updatedAt: "2026-04-08T09:30:00.000Z",
    publishedAt: "2026-04-07T03:00:00.000Z",
  },
  {
    id: "motion-language-for-case-studies",
    title: "Motion Language for Technical Case Studies",
    slug: "motion-language-for-technical-case-studies",
    excerpt:
      "A lightweight animation system for archive-style product writing, built around pace, hierarchy, and restraint.",
    category: "Interaction",
    tags: ["Motion", "Framer Motion", "Content Design"],
    coverImage:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    content: `# Motion Language for Technical Case Studies

This draft defines how entries should arrive on screen.

## Principles

- headers enter first
- metadata trails by 80 to 120ms
- media scales subtly instead of bouncing

## Next up

Refine how archive cards and detail pages share the same motion grammar.`,
    seoTitle: "Motion Language for Technical Case Studies",
    seoDescription:
      "Define a restrained animation system for archive pages, editorial cards, and deep-dive technical articles.",
    status: "In Review",
    updatedAt: "2026-04-09T02:15:00.000Z",
    publishedAt: null,
  },
  {
    id: "building-a-better-article-template",
    title: "Building a Better Article Template",
    slug: "building-a-better-article-template",
    excerpt:
      "Notes on what a reusable article template needs before the archive starts growing too fast to maintain.",
    category: "Workflow",
    tags: ["CMS", "Publishing", "Templates"],
    coverImage:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    content: `# Building a Better Article Template

The template should make the right thing the easy thing.

## Required fields

- title
- slug
- excerpt
- category
- cover image

## Draft notes

Keep the preview visible while editing so formatting issues show up immediately.`,
    seoTitle: "Building a Better Article Template",
    seoDescription:
      "A practical template for writing technical articles with consistent metadata, structure, and preview behavior.",
    status: "Draft",
    updatedAt: "2026-04-09T05:40:00.000Z",
    publishedAt: null,
  },
  {
    id: "april-release-notes-preview",
    title: "April Release Notes Preview",
    slug: "april-release-notes-preview",
    excerpt:
      "The next archive release is staged with refreshed templates, admin tooling, and a tighter publishing workflow.",
    category: "Release Notes",
    tags: ["Release", "Ops", "Editorial"],
    coverImage:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
    content: `# April Release Notes Preview

This entry is queued for publishing after editorial review.

## Planned additions

- admin workspace
- better article status tracking
- stronger SEO defaults`,
    seoTitle: "April Release Notes Preview",
    seoDescription:
      "A scheduled preview of the next release for the archive, including the publishing workspace and editorial tooling.",
    status: "Scheduled",
    updatedAt: "2026-04-08T17:20:00.000Z",
    publishedAt: "2026-04-12T01:00:00.000Z",
  },
];
