#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log_step() {
  printf '\n[dev] %s\n' "$1"
}

run_cmd() {
  printf '[dev] $ %s\n' "$*"
  "$@"
}

print_urls() {
  local web_port api_port
  web_port="${WEB_PORT:-3000}"
  api_port="${API_PORT:-8080}"

  printf '[dev] Frontend: http://localhost:%s\n' "$web_port"
  printf '[dev] Admin:    http://localhost:%s/admin\n' "$web_port"
  printf '[dev] API:      http://localhost:%s/healthz\n' "$api_port"
}

if [ ! -f .env ]; then
  log_step "No .env found. Creating one from .env.example"
  cp .env.example .env
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

log_step "Using env file: .env"
log_step "Using compose file: docker-compose.yml"
print_urls
log_step "Starting development stack with image build and live log streaming"
run_cmd docker compose --env-file .env up --build
