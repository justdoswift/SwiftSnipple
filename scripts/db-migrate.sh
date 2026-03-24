#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_URL="${DATABASE_URL:-postgres://swiftsnippet:swiftsnippet@127.0.0.1:5432/swiftsnippet?sslmode=disable}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to run migrations." >&2
  exit 1
fi

for file in "$ROOT_DIR"/infra/postgres/migrations/*.sql; do
  echo "Applying migration: $(basename "$file")"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$file"
done
