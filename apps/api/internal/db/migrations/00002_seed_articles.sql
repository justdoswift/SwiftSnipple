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
    'Designing Editorial Glass Panels for iOS 26',
    'designing-editorial-glass-panels-ios-26',
    'A field note on turning spatial glass treatments into stable SwiftUI building blocks without losing editorial sharpness.',
    'Design Systems',
    ARRAY['SwiftUI', 'Liquid Glass', 'Editorial UI'],
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    '# Designing Editorial Glass Panels for iOS 26

SwiftUI can feel sterile when every glass card looks identical. The goal here is to make the material system feel edited, not auto-generated.

## What we kept

- oversized headlines with strict line lengths
- low-contrast dividers instead of heavy card chrome
- a restrained palette that lets motion do the talking',
    'Designing Editorial Glass Panels for iOS 26',
    'Learn how to translate high-end editorial glass treatments into production-minded SwiftUI patterns.',
    'Published',
    '2026-04-07T03:00:00Z',
    '2026-04-07T03:00:00Z',
    '2026-04-08T09:30:00Z'
  ),
  (
    '9c47a567-d963-4d85-af3e-3fd9d0899e0d',
    'Motion Language for Technical Case Studies',
    'motion-language-for-technical-case-studies',
    'A lightweight animation system for archive-style product writing, built around pace, hierarchy, and restraint.',
    'Interaction',
    ARRAY['Motion', 'Framer Motion', 'Content Design'],
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    '# Motion Language for Technical Case Studies

This draft defines how entries should arrive on screen.

## Principles

- headers enter first
- metadata trails by 80 to 120ms
- media scales subtly instead of bouncing',
    'Motion Language for Technical Case Studies',
    'Define a restrained animation system for archive pages, editorial cards, and deep-dive technical articles.',
    'In Review',
    NULL,
    '2026-04-09T02:15:00Z',
    '2026-04-09T02:15:00Z'
  ),
  (
    '2049c31d-8db7-46db-b2b0-dd2854cac884',
    'Building a Better Article Template',
    'building-a-better-article-template',
    'Notes on what a reusable article template needs before the archive starts growing too fast to maintain.',
    'Workflow',
    ARRAY['CMS', 'Publishing', 'Templates'],
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
    '# Building a Better Article Template

The template should make the right thing the easy thing.

## Required fields

- title
- slug
- excerpt
- category
- cover image',
    'Building a Better Article Template',
    'A practical template for writing technical articles with consistent metadata, structure, and preview behavior.',
    'Draft',
    NULL,
    '2026-04-09T05:40:00Z',
    '2026-04-09T05:40:00Z'
  ),
  (
    '2e74bd25-6ccf-4576-ab66-9940ef813f9c',
    'April Release Notes Preview',
    'april-release-notes-preview',
    'The next archive release is staged with refreshed templates, admin tooling, and a tighter publishing workflow.',
    'Release Notes',
    ARRAY['Release', 'Ops', 'Editorial'],
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    '# April Release Notes Preview

This entry is queued for publishing after editorial review.

## Planned additions

- admin workspace
- better article status tracking
- stronger SEO defaults',
    'April Release Notes Preview',
    'A scheduled preview of the next release for the archive, including the publishing workspace and editorial tooling.',
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
