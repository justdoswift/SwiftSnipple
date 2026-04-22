#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-$ROOT_DIR/.env.deploy}"

log_step() {
  printf '\n[%s] %s\n' "${SCRIPT_NAME:-deploy}" "$1"
}

run_cmd() {
  printf '[%s] $' "${SCRIPT_NAME:-deploy}"
  printf ' %q' "$@"
  printf '\n'
  "$@"
}

fail() {
  printf '[%s] ERROR: %s\n' "${SCRIPT_NAME:-deploy}" "$1" >&2
  exit 1
}

warn() {
  printf '[%s] WARN: %s\n' "${SCRIPT_NAME:-deploy}" "$1" >&2
}

load_deploy_env() {
  if [[ ! -f "$DEPLOY_ENV_FILE" ]]; then
    fail "missing deploy env file: $DEPLOY_ENV_FILE (copy .env.deploy.example first)"
  fi

  set -a
  # shellcheck disable=SC1090
  . "$DEPLOY_ENV_FILE"
  set +a
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

require_env() {
  local value="${!1:-}"
  [[ -n "${value// }" ]] || fail "required env var is missing: $1"
}

check_vercel_login() {
  local account
  account="$(vercel whoami 2>/dev/null || true)"
  [[ -n "${account// }" ]] || fail "vercel CLI is not logged in; run: vercel login"
}

check_gcloud_login() {
  local account
  account="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -n 1)"
  [[ -n "${account// }" ]] || fail "gcloud CLI is not logged in; run: gcloud auth login"
}

ensure_gcloud_project() {
  require_env GCLOUD_PROJECT_ID
  run_cmd gcloud config set project "$GCLOUD_PROJECT_ID" >/dev/null
}

join_by() {
  local delimiter="$1"
  shift
  local first=1
  for item in "$@"; do
    if [[ $first -eq 1 ]]; then
      printf '%s' "$item"
      first=0
    else
      printf '%s%s' "$delimiter" "$item"
    fi
  done
}
