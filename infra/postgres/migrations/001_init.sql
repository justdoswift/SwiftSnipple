create table if not exists snippet (
  id text primary key,
  title text not null,
  summary text not null,
  category_primary text not null,
  difficulty text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists snippet_version (
  id bigserial primary key,
  snippet_id text not null references snippet(id) on delete cascade,
  version text not null,
  source_revision text not null,
  changelog text not null default '',
  created_at timestamptz not null default now(),
  unique (snippet_id, version)
);

create table if not exists publish_state (
  snippet_id text primary key references snippet(id) on delete cascade,
  state text not null check (state in ('draft', 'review', 'published')),
  published_version text,
  reviewed_at timestamptz,
  published_at timestamptz
);

create table if not exists snippet_asset (
  id bigserial primary key,
  snippet_id text not null references snippet(id) on delete cascade,
  version_id bigint references snippet_version(id) on delete cascade,
  asset_kind text not null,
  path text not null,
  mime_type text not null,
  is_required boolean not null default false
);
