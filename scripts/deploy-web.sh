#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="deploy-web"
# shellcheck disable=SC1091
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/deploy-common.sh"

load_deploy_env
require_command vercel
check_vercel_login
require_env API_BASE_URL

if [[ ! -f "$ROOT_DIR/apps/web/.vercel/project.json" ]]; then
  require_env VERCEL_PROJECT_NAME
  log_step "Linking apps/web to Vercel project"
  run_cmd vercel link --cwd "$ROOT_DIR/apps/web" --yes --project "$VERCEL_PROJECT_NAME"
fi

log_step "Deploying frontend to Vercel"
build_env_api_base_url="$API_BASE_URL"
if [[ "$API_BASE_URL" == "$APP_BASE_URL" ]]; then
  build_env_api_base_url=""
fi

deployment_url="$(
  cd "$ROOT_DIR/apps/web" && \
    vercel deploy --prod --yes --build-env "VITE_API_BASE_URL=$build_env_api_base_url"
)"

resolved_url="$(printf '%s\n' "$deployment_url" | rg -o 'https://[^ ]+' | tail -n 1)"
if [[ -z "${resolved_url// }" ]]; then
  fail "could not determine Vercel deployment URL"
fi

printf '[%s] Web URL: %s\n' "$SCRIPT_NAME" "$resolved_url"
