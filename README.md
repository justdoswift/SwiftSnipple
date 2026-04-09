# SwiftSnipple

SwiftSnipple is a SwiftUI snippet showcase and implementation library.

The goal is simple: collect fun, polished, and genuinely useful SwiftUI builds, then make them easy to browse, study, and reuse. Code is the center of the product, with prompts, notes, and implementation context added when they help someone rebuild the idea faster.

## What SwiftSnipple Is

SwiftSnipple is a growing collection of:

- SwiftUI snippets worth reusing
- interaction patterns and UI details worth studying
- small implementation breakdowns
- prompt-assisted workflows that helped shape a build
- practical notes that make a snippet easier to adapt

This project is not meant to be a long-form publishing platform. It is a showcase library for people who like collecting strong SwiftUI references and turning them into real product work.

## Who It Is For

SwiftSnipple is for people who:

- build with SwiftUI regularly
- care about polish, interaction feel, and visual craft
- prefer real examples over abstract tutorials
- want a useful library of patterns they can borrow from
- are curious about how AI prompts can support implementation work

## What a Snippet Can Include

Each snippet can include a mix of:

- the SwiftUI implementation itself
- screenshots or visual references
- a short explanation of the structure or tradeoffs
- reusable prompt ideas
- implementation notes that help someone adapt it

The core unit is still the snippet or pattern, not the article.

## Product Direction

SwiftSnipple is evolving into a curated SwiftUI showcase, not a Substack-style writing product.

Current and planned product layers include:

- a public library for browsing SwiftUI snippets and patterns
- a lightweight admin workspace for publishing and managing entries
- richer snippet metadata such as prompts, notes, tags, and references
- a future premium layer for accessing the full library or deeper companion material

## Membership Roadmap

Stripe and membership access are future roadmap items, not current product behavior.

That future layer may include:

- access to the full snippet library
- premium prompt packs
- deeper implementation notes
- downloadable companion resources

Pricing, packaging, and access rules are intentionally still open.

## Tech Stack

SwiftSnipple uses a single-repo web + API setup:

- `apps/web`: React, TypeScript, Vite, Tailwind CSS, React Router, Motion
- `apps/api`: Go, chi, pgx, goose
- PostgreSQL: canonical content store
- Caddy: production reverse proxy, domain routing, and HTTPS

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

- `apps/web`: public showcase and admin workspace
- `apps/api`: Go API and database migrations
- `infra/caddy`: production Caddy config
- `scripts`: one-command build/start/stop helpers

## Project Intent

The long-term value of SwiftSnipple comes from:

- strong SwiftUI taste
- reusable implementation details
- practical prompt support
- a clean way to browse and manage snippets

Everything in this repo should move the project closer to being a high-quality SwiftUI snippet library.
