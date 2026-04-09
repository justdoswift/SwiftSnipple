#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log_step() {
  printf '\n[build] %s\n' "$1"
}

run_cmd() {
  printf '[build] $ %s\n' "$*"
  "$@"
}

if [ ! -f .env ]; then
  log_step "No .env found. Creating one from .env.example"
  cp .env.example .env
fi

log_step "Using env file: .env"
log_step "Using compose file: docker-compose.prod.yml"
log_step "Building production images"
run_cmd docker compose -f docker-compose.prod.yml --env-file .env build
log_step "Production image build completed"
