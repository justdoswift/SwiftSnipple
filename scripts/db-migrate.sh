#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_URL="${DATABASE_URL:-postgres://swiftsnippet:swiftsnippet@127.0.0.1:5432/swiftsnippet?sslmode=disable}"

for file in "$ROOT_DIR"/infra/postgres/migrations/*.sql; do
  echo "Applying migration: $(basename "$file")"
  DATABASE_URL="$DB_URL" bash "$ROOT_DIR/scripts/psql.sh" -v ON_ERROR_STOP=1 <"$file"
done
