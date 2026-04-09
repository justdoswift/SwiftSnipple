<div align="center">
  <img
    width="1200"
    height="475"
    alt="SwiftSnipple banner"
    src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6"
  />
</div>

# SwiftSnipple

SwiftSnipple is a curated SwiftUI snippets and patterns platform for people who care about interface craft, implementation detail, and AI-assisted building.

The goal is simple: collect delightful, useful, and production-minded SwiftUI ideas, then package them with the context that makes them genuinely reusable. That means not just code, but also implementation notes, AI prompts, and the reasoning behind each build.

## What SwiftSnipple Is

SwiftSnipple is building an archive of:

- SwiftUI implementations worth studying
- interaction patterns and polished UI details
- code snippets and reusable technical ideas
- prompt workflows used to generate, refine, or explain builds
- editorial breakdowns that help readers understand why something works

This project is not meant to be a raw dump of snippets. It is a platform for learning, collecting references, and sharing high-signal SwiftUI work with an audience that enjoys both design and engineering.

## Who It Is For

SwiftSnipple is for people who:

- love building with SwiftUI
- care about motion, layout, polish, and interface feel
- like learning through real examples instead of abstract tutorials
- are curious about AI-assisted workflows for design and implementation
- want a growing archive of practical, inspiring Apple-platform patterns

## What Each Entry Can Include

Each entry in the archive may include a mix of:

- a SwiftUI implementation or recreation
- screenshots or visual references
- implementation notes and tradeoffs
- reusable patterns or snippet-level takeaways
- AI prompts used during the build process
- editorial context that explains the intent behind the interface

The aim is to make every post useful whether someone wants to copy a small technique, study the overall structure, or understand how prompts and code can work together.

## Product Direction

SwiftSnipple is evolving into a content platform, not just a code gallery.

Current and planned product layers include:

- a public archive for browsing highlighted SwiftUI work
- richer article/case-study style entries with prompts and implementation notes
- an internal admin/editorial workflow for managing new content
- a future premium membership layer for accessing the full archive

## Membership Roadmap

In a later phase, SwiftSnipple plans to integrate Stripe and introduce membership access for premium content.

That future layer may include:

- full access to the complete archive
- premium case studies or longer technical breakdowns
- gated prompt libraries
- downloadable assets or member-only implementation notes

This is roadmap direction, not a shipped feature. Pricing, packaging, and access rules are intentionally still open.

## Tech Stack

SwiftSnipple now uses a single-repo web + API setup:

- `apps/web`: React, TypeScript, Vite, Tailwind CSS, React Router, Motion
- `apps/api`: Go, chi, pgx, goose
- PostgreSQL: canonical content store
- Caddy: production reverse proxy, domain routing, and HTTPS

It currently includes a public-facing archive experience and a lightweight admin workspace for managing article-style content backed by a Go API.

## Local Development

Prerequisites:

- Node.js
- Go
- Docker

Copy environment variables:

```bash
cp .env.example .env
```

Start the full local stack:

```bash
bash scripts/dev.sh
```

Other useful commands:

```bash
bash scripts/stop.sh
bash scripts/build.sh
bash scripts/start.sh
make dev
make stop
make logs
```

Default ports:

- Web: `3000`
- API: `8080`
- PostgreSQL: `5432`

## Repository Layout

- `apps/web`: public site and admin workspace
- `apps/api`: Go API and database migrations
- `infra/caddy`: production Caddy config
- `scripts`: one-command build/start/stop helpers

## Project Intent

The long-term value of SwiftSnipple comes from the combination of:

- strong visual taste
- practical SwiftUI implementation details
- reusable prompt workflows
- a clean, searchable archive experience

Everything in this repo should move the project closer to that outcome.
