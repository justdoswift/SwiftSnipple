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

fail() {
  printf '[build] ERROR: %s\n' "$1" >&2
  exit 1
}

warn() {
  printf '[build] WARN: %s\n' "$1" >&2
}

sync_repo() {
  local sync_mode
  sync_mode="${GIT_SYNC_MODE:-auto}"

  if [ "$sync_mode" = "off" ]; then
    log_step "Skipping repository sync (GIT_SYNC_MODE=off)"
    return
  fi

  log_step "Syncing repository to the latest origin commit"

  if ! command -v git >/dev/null 2>&1; then
    [ "$sync_mode" = "strict" ] && fail "git is not available"
    warn "git is not available; continuing without pulling latest changes"
    return
  fi

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    [ "$sync_mode" = "strict" ] && fail "current directory is not a git work tree"
    warn "current directory is not a git work tree; continuing without pulling latest changes"
    return
  fi

  if ! git diff --quiet --ignore-submodules -- || ! git diff --cached --quiet --ignore-submodules --; then
    [ "$sync_mode" = "strict" ] && fail "repository has local tracked changes; commit or stash them before running build"
    warn "repository has local tracked changes; skipping git pull and continuing with current checkout"
    return
  fi

  local current_branch
  current_branch="$(git branch --show-current)"
  if [ -z "$current_branch" ]; then
    [ "$sync_mode" = "strict" ] && fail "repository is in detached HEAD state; switch to a branch before running build"
    warn "repository is in detached HEAD state; skipping git pull and continuing with current checkout"
    return
  fi

  run_cmd git pull --ff-only origin "$current_branch"
}

sync_repo

if [ ! -f .env ]; then
  log_step "No .env found. Creating one from .env.example"
  cp .env.example .env
fi

log_step "Using env file: .env"
log_step "Using compose file: docker-compose.prod.yml"
log_step "Building production images"
run_cmd docker compose -f docker-compose.prod.yml --env-file .env build
log_step "Production image build completed"
