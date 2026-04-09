-- +goose Up
INSERT INTO articles (
  id,
  title,
  slug,
  excerpt,
  category,
  tags,
  cover_image,
  content,
  seo_title,
  seo_description,
  status,
  published_at,
  created_at,
  updated_at
)
VALUES
  (
    '9f5d13f9-40a7-4dde-9b91-4c5530b03c61',
    'Building Liquid Glass Panels for iOS 26',
    'building-liquid-glass-panels-ios-26',
    'A field note on turning spatial glass treatments into stable SwiftUI building blocks without losing visual sharpness.',
    'Design Systems',
    ARRAY['SwiftUI', 'Liquid Glass', 'Glass UI'],
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    '# Building Liquid Glass Panels for iOS 26

SwiftUI can feel sterile when every glass card looks identical. The goal here is to make the material system feel deliberate, not auto-generated.

## What we kept

- oversized headlines with strict line lengths
- low-contrast dividers instead of heavy card chrome
- a restrained palette that lets motion do the talking',
    'Building Liquid Glass Panels for iOS 26',
    'Learn how to translate high-end glass treatments into production-minded SwiftUI patterns.',
    'Published',
    '2026-04-07T03:00:00Z',
    '2026-04-07T03:00:00Z',
    '2026-04-08T09:30:00Z'
  ),
  (
    '9c47a567-d963-4d85-af3e-3fd9d0899e0d',
    'Motion Language for SwiftUI Snippets',
    'motion-language-for-swiftui-snippets',
    'A lightweight animation system for snippet cards, previews, and detail views, built around pace, hierarchy, and restraint.',
    'Interaction',
    ARRAY['Motion', 'Framer Motion', 'Content Design'],
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    '# Motion Language for SwiftUI Snippets

This draft defines how entries should arrive on screen.

## Principles

- headers enter first
- metadata trails by 80 to 120ms
- media scales subtly instead of bouncing',
    'Motion Language for SwiftUI Snippets',
    'Define a restrained animation system for snippet grids, preview cards, and deep-dive implementation entries.',
    'In Review',
    NULL,
    '2026-04-09T02:15:00Z',
    '2026-04-09T02:15:00Z'
  ),
  (
    '2049c31d-8db7-46db-b2b0-dd2854cac884',
    'Building a Better Snippet Template',
    'building-a-better-snippet-template',
    'Notes on what a reusable snippet template needs before the library starts growing too fast to maintain.',
    'Workflow',
    ARRAY['CMS', 'Publishing', 'Snippets'],
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
    '# Building a Better Snippet Template

The template should make the right thing the easy thing.

## Required fields

- title
- slug
- excerpt
- category
- cover image',
    'Building a Better Snippet Template',
    'A practical template for publishing reusable SwiftUI snippets with consistent metadata, structure, and preview behavior.',
    'Draft',
    NULL,
    '2026-04-09T05:40:00Z',
    '2026-04-09T05:40:00Z'
  ),
  (
    '2e74bd25-6ccf-4576-ab66-9940ef813f9c',
    'April Snippet Pack Preview',
    'april-snippet-pack-preview',
    'The next release is staged with refreshed templates, admin tooling, and a tighter snippet workflow.',
    'Release Notes',
    ARRAY['Release', 'Ops', 'Snippets'],
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    '# April Snippet Pack Preview

This entry is queued for publishing after final review.

## Planned additions

- admin workspace
- better snippet status tracking
- stronger SEO defaults',
    'April Snippet Pack Preview',
    'A scheduled preview of the next release, including the publishing workspace and snippet tooling.',
    'Scheduled',
    '2026-04-12T01:00:00Z',
    '2026-04-08T17:20:00Z',
    '2026-04-08T17:20:00Z'
  )
ON CONFLICT (id) DO NOTHING;

-- +goose Down
DELETE FROM articles
WHERE id IN (
  '9f5d13f9-40a7-4dde-9b91-4c5530b03c61',
  '9c47a567-d963-4d85-af3e-3fd9d0899e0d',
  '2049c31d-8db7-46db-b2b0-dd2854cac884',
  '2e74bd25-6ccf-4576-ab66-9940ef813f9c'
);
