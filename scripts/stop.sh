#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log_step() {
  printf '\n[stop] %s\n' "$1"
}

run_cmd() {
  printf '[stop] $ %s\n' "$*"
  "$@"
}

ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE=".env.example"
fi

log_step "Using env file: $ENV_FILE"
log_step "Using compose file: docker-compose.yml"
log_step "Stopping containers and removing orphans"
run_cmd docker compose --env-file "$ENV_FILE" down --remove-orphans
log_step "Shutdown completed"
