#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="deploy-check"
# shellcheck disable=SC1091
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/deploy-common.sh"

load_deploy_env

log_step "Checking required CLIs"
require_command vercel
require_command gcloud
require_command docker
require_command go

log_step "Checking CLI login state"
check_vercel_login
check_gcloud_login
ensure_gcloud_project

log_step "Checking required deploy configuration"
required_vars=(
  GCLOUD_PROJECT_ID
  GCLOUD_REGION
  CLOUD_RUN_SERVICE
  GCS_BUCKET
  GCS_PROJECT_ID
  NEON_DATABASE_URL
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  STRIPE_PRICE_ID
  APP_BASE_URL
  API_BASE_URL
  ADMIN_EMAIL
  ADMIN_PASSWORD
  ADMIN_SESSION_SECRET
  MEMBER_SESSION_SECRET
)

for name in "${required_vars[@]}"; do
  require_env "$name"
done

log_step "Checking repository layout"
[[ -f "$ROOT_DIR/apps/api/Dockerfile" ]] || fail "apps/api/Dockerfile not found"
[[ -f "$ROOT_DIR/apps/web/package.json" ]] || fail "apps/web/package.json not found"

if [[ ! -f "$ROOT_DIR/apps/web/.vercel/project.json" && -z "${VERCEL_PROJECT_NAME:-}" ]]; then
  fail "apps/web is not linked to Vercel yet; run vercel link in apps/web or set VERCEL_PROJECT_NAME"
fi

log_step "Deploy prerequisites look good"
