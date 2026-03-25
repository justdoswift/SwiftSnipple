#!/usr/bin/env bash

set -euo pipefail

DATABASE_URL_INPUT="${DATABASE_URL:-}"

if [[ -z "$DATABASE_URL_INPUT" ]]; then
	echo "DATABASE_URL is required." >&2
	exit 1
fi

if command -v psql >/dev/null 2>&1; then
	exec psql "$DATABASE_URL_INPUT" "$@"
fi

if ! command -v docker >/dev/null 2>&1; then
	echo "psql is not installed and docker is unavailable for the fallback client." >&2
	exit 1
fi

DOCKER_DATABASE_URL="$(
	DATABASE_URL="$DATABASE_URL_INPUT" node -e '
		const raw = process.env.DATABASE_URL;
		const url = new URL(raw);
		if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
			url.hostname = "host.docker.internal";
		}
		process.stdout.write(url.toString());
	'
)"

exec docker run --rm -i postgres:16 psql "$DOCKER_DATABASE_URL" "$@"
