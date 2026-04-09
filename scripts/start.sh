#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log_step() {
  printf '\n[start] %s\n' "$1"
}

run_cmd() {
  printf '[start] $ %s\n' "$*"
  "$@"
}

fail() {
  printf '[start] ERROR: %s\n' "$1" >&2
  printf '[start] Logs: docker compose -f docker-compose.prod.yml --env-file .env logs -f\n' >&2
  exit 1
}

print_urls() {
  local api_port caddy_domain caddy_http_port caddy_https_port
  api_port="${API_PORT:-8080}"
  caddy_domain="${CADDY_DOMAIN:-localhost}"
  caddy_http_port="${CADDY_HTTP_PORT:-80}"
  caddy_https_port="${CADDY_HTTPS_PORT:-443}"
  local http_base https_base

  if [ "$caddy_http_port" = "80" ]; then
    http_base="http://${caddy_domain}"
  else
    http_base="http://${caddy_domain}:${caddy_http_port}"
  fi

  if [ "$caddy_https_port" = "443" ]; then
    https_base="https://${caddy_domain}"
  else
    https_base="https://${caddy_domain}:${caddy_https_port}"
  fi

  printf '[start] Frontend: %s\n' "$http_base"
  printf '[start] Admin:    %s/admin\n' "$http_base"
  printf '[start] API:      http://localhost:%s/healthz\n' "$api_port"
  printf '[start] Caddy:    %s\n' "$http_base"
  printf '[start] Caddy TLS:%s\n' "$https_base"
}

check_builder() {
  log_step "Checking Docker and Compose availability"
  docker version >/dev/null 2>&1 || fail "docker is not available"
  docker compose version >/dev/null 2>&1 || fail "docker compose is not available"
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

wait_for_health() {
  log_step "Waiting for Caddy health endpoint"

  local primary_url fallback_url
  primary_url="http://localhost/healthz"
  fallback_url="http://localhost:${CADDY_HTTP_PORT:-80}/healthz"

  for _ in $(seq 1 20); do
    if curl --connect-timeout 2 --max-time 4 -fsS "$primary_url" >/dev/null 2>&1; then
      return 0
    fi
    if curl --connect-timeout 2 --max-time 4 -fsS "$fallback_url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done

  fail "health check did not pass via $primary_url or $fallback_url"
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
log_step "Using compose file: docker-compose.prod.yml"
check_builder
build_web_bundle
log_step "Starting production-style services in detached mode"
run_cmd docker compose -f docker-compose.prod.yml --env-file .env up -d --build

log_step "Running database migrations"
run_cmd docker compose -f docker-compose.prod.yml --env-file .env --profile migrate run --rm migrate

wait_for_health
log_step "Startup completed"
print_urls
printf '[start] Next step: docker compose -f docker-compose.prod.yml --env-file .env logs -f\n'
