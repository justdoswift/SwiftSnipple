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

build_web_bundle() {
  log_step "Preparing frontend production bundle"

  if [ ! -d apps/web/node_modules ]; then
    log_step "Frontend dependencies not found. Installing them locally"
    run_cmd npm --prefix apps/web install
  else
    log_step "Using existing frontend dependencies from apps/web/node_modules"
  fi

  run_cmd npm --prefix apps/web run build
}

if [ ! -f .env ]; then
  log_step "No .env found. Creating one from .env.example"
  cp .env.example .env
fi

log_step "Using env file: .env"
log_step "Using compose file: docker-compose.prod.yml"
build_web_bundle
log_step "Building production images"
run_cmd docker compose -f docker-compose.prod.yml --env-file .env build
log_step "Production image build completed"
