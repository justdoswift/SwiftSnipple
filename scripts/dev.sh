#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="${PID_FILE:-$ROOT_DIR/.swiftsnippet.pids}"

cd "$ROOT_DIR"

echo "Stopping existing SwiftSnippet services from pid file..."
PID_FILE="$PID_FILE" bash "$ROOT_DIR/scripts/stop.sh"

ORIGINAL_API_PORT="${API_PORT-}"
ORIGINAL_WEB_PORT="${WEB_PORT-}"
ORIGINAL_API_ADDRESS="${API_ADDRESS-}"
ORIGINAL_API_BASE_URL="${API_BASE_URL-}"
ORIGINAL_DATABASE_URL="${DATABASE_URL-}"
ORIGINAL_ADMIN_PASSWORD="${ADMIN_PASSWORD-}"
ORIGINAL_ADMIN_SESSION_SECRET="${ADMIN_SESSION_SECRET-}"
ORIGINAL_ADMIN_SESSION_TTL="${ADMIN_SESSION_TTL-}"

if [[ -f "$ROOT_DIR/.env" ]]; then
	set -a
	# shellcheck source=/dev/null
	source "$ROOT_DIR/.env"
	set +a
fi

if [[ -n "$ORIGINAL_API_PORT" ]]; then
	API_PORT="$ORIGINAL_API_PORT"
fi
if [[ -n "$ORIGINAL_WEB_PORT" ]]; then
	WEB_PORT="$ORIGINAL_WEB_PORT"
fi
if [[ -n "$ORIGINAL_API_ADDRESS" ]]; then
	API_ADDRESS="$ORIGINAL_API_ADDRESS"
fi
if [[ -n "$ORIGINAL_API_BASE_URL" ]]; then
	API_BASE_URL="$ORIGINAL_API_BASE_URL"
fi
if [[ -n "$ORIGINAL_DATABASE_URL" ]]; then
	DATABASE_URL="$ORIGINAL_DATABASE_URL"
fi
if [[ -n "$ORIGINAL_ADMIN_PASSWORD" ]]; then
	ADMIN_PASSWORD="$ORIGINAL_ADMIN_PASSWORD"
fi
if [[ -n "$ORIGINAL_ADMIN_SESSION_SECRET" ]]; then
	ADMIN_SESSION_SECRET="$ORIGINAL_ADMIN_SESSION_SECRET"
fi
if [[ -n "$ORIGINAL_ADMIN_SESSION_TTL" ]]; then
	ADMIN_SESSION_TTL="$ORIGINAL_ADMIN_SESSION_TTL"
fi

if ! command -v pnpm >/dev/null 2>&1; then
	echo "pnpm is required. Install it with: corepack enable && corepack prepare pnpm@latest --activate" >&2
	exit 1
fi

if ! command -v go >/dev/null 2>&1; then
	echo "go is required to start the API." >&2
	exit 1
fi

API_PORT="${API_PORT:-18080}"
WEB_PORT="${WEB_PORT:-13000}"
if [[ -z "${API_ADDRESS:-}" || ( "${API_ADDRESS}" == ":18080" && "${API_PORT}" != "18080" ) ]]; then
	API_ADDRESS=":$API_PORT"
fi
if [[ -z "${API_BASE_URL:-}" || ( "${API_BASE_URL}" == "http://127.0.0.1:18080" && "${API_PORT}" != "18080" ) ]]; then
	API_BASE_URL="http://127.0.0.1:$API_PORT"
fi
DATABASE_URL="${DATABASE_URL:-postgres://swiftsnippet:swiftsnippet@127.0.0.1:5432/swiftsnippet?sslmode=disable}"

free_port() {
	local port="$1"
	if ! command -v lsof >/dev/null 2>&1; then
		return
	fi

	local pids
	pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
	if [[ -z "$pids" ]]; then
		return
	fi

	echo "Stopping stale listener(s) on port $port: $pids"
	for pid in $pids; do
		kill "$pid" 2>/dev/null || true
	done
}

db_ready() {
	DATABASE_URL="$DATABASE_URL" bash "$ROOT_DIR/scripts/psql.sh" -Atqc 'select 1' >/dev/null 2>&1
}

if db_ready; then
	echo "Reusing existing PostgreSQL from DATABASE_URL."
else
	if ! command -v docker >/dev/null 2>&1; then
		echo "DATABASE_URL is not reachable and docker is unavailable for fallback startup." >&2
		exit 1
	fi

	echo "DATABASE_URL is not reachable. Starting project postgres via docker compose..."
	docker compose -f "$ROOT_DIR/infra/postgres/docker-compose.yml" up -d postgres

	for _ in $(seq 1 30); do
		if db_ready; then
			break
		fi
		sleep 1
	done

	if ! db_ready; then
		echo "PostgreSQL did not become ready in time. Check DATABASE_URL or docker compose logs." >&2
		exit 1
	fi
fi

echo "Applying database migrations..."
DATABASE_URL="$DATABASE_URL" bash "$ROOT_DIR/scripts/db-migrate.sh"

if [[ ! -x "$ROOT_DIR/node_modules/.bin/pnpm" && ! -d "$ROOT_DIR/node_modules" ]]; then
	echo "Installing workspace dependencies with pnpm..."
	pnpm install
fi

echo "Ensuring web dependencies are installed..."
(cd "$ROOT_DIR/apps/web" && pnpm install --frozen-lockfile)

echo "Starting API on http://127.0.0.1:$API_PORT ..."
free_port "$API_PORT"
(
	cd "$ROOT_DIR/apps/api"
	API_ADDRESS="$API_ADDRESS" \
	DATABASE_URL="$DATABASE_URL" \
	APP_ENV=development \
	ADMIN_PASSWORD="${ADMIN_PASSWORD:-}" \
	ADMIN_SESSION_SECRET="${ADMIN_SESSION_SECRET:-}" \
	ADMIN_SESSION_TTL="${ADMIN_SESSION_TTL:-}" \
	go run ./cmd/api
) &
api_pid=$!

echo "Starting Web on http://127.0.0.1:$WEB_PORT ..."
free_port "$WEB_PORT"
(
	cd "$ROOT_DIR/apps/web"
	API_BASE_URL="$API_BASE_URL" pnpm exec vite dev --host 0.0.0.0 --port "$WEB_PORT"
) &
web_pid=$!

printf "%s\n%s\n" "$api_pid" "$web_pid" >"$PID_FILE"

cleanup() {
	echo
	echo "Stopping SwiftSnippet services..."
	PID_FILE="$PID_FILE" bash "$ROOT_DIR/scripts/stop.sh" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

echo "Services started."
echo "- API: http://127.0.0.1:$API_PORT"
echo "- Web: http://127.0.0.1:$WEB_PORT"
echo
echo "Press Ctrl+C to stop."

wait
