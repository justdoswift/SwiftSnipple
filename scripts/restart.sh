#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SCRIPT_NAME="restart"
ENV_FILE=".env"
COMPOSE_ARGS=(--env-file "$ENV_FILE")
PROD_COMPOSE_FILE="docker-compose.prod.yml"

log_step() {
  printf '\n[%s] %s\n' "$SCRIPT_NAME" "$1"
}

run_cmd() {
  printf '[%s] $' "$SCRIPT_NAME"
  printf ' %q' "$@"
  printf '\n'
  "$@"
}

if [[ ! -f "$ENV_FILE" ]]; then
  log_step "No .env found, copying defaults from .env.example"
  cp .env.example "$ENV_FILE"
else
  log_step "Using environment file $ENV_FILE"
fi

log_step "Stopping any running development stack"
run_cmd docker compose "${COMPOSE_ARGS[@]}" down --remove-orphans || true

log_step "Stopping any running production-style stack"
run_cmd docker compose -f "$PROD_COMPOSE_FILE" "${COMPOSE_ARGS[@]}" down --remove-orphans || true

log_step "Restarting production-style services"
run_cmd bash scripts/start.sh
