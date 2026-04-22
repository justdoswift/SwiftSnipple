#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="deploy-api"
# shellcheck disable=SC1091
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/deploy-common.sh"

load_deploy_env
require_command gcloud
check_gcloud_login
ensure_gcloud_project

required_vars=(
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

log_step "Deploying Go API to Cloud Run"
env_vars=(
  "API_PORT=8080"
  "DATABASE_URL=$NEON_DATABASE_URL"
  "ADMIN_EMAIL=$ADMIN_EMAIL"
  "ADMIN_PASSWORD=$ADMIN_PASSWORD"
  "ADMIN_SESSION_SECRET=$ADMIN_SESSION_SECRET"
  "MEMBER_SESSION_SECRET=$MEMBER_SESSION_SECRET"
  "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
  "STRIPE_PRICE_ID=$STRIPE_PRICE_ID"
  "STRIPE_SUCCESS_URL=$APP_BASE_URL/account?checkout=success"
  "STRIPE_CANCEL_URL=$APP_BASE_URL/account?checkout=cancelled"
  "STRIPE_PORTAL_RETURN_URL=$APP_BASE_URL/account"
  "STORAGE_PROVIDER=gcs"
  "GCS_BUCKET=$GCS_BUCKET"
  "GCS_PROJECT_ID=$GCS_PROJECT_ID"
)

if [[ -n "${GCS_CREDENTIALS:-}" ]]; then
  env_vars+=("GCS_CREDENTIALS=$GCS_CREDENTIALS")
fi
if [[ -n "${GCS_PUBLIC_BASE_URL:-}" ]]; then
  env_vars+=("GCS_PUBLIC_BASE_URL=$GCS_PUBLIC_BASE_URL")
fi

run_cmd gcloud run deploy "$CLOUD_RUN_SERVICE" \
  --source "$ROOT_DIR/apps/api" \
  --project "$GCLOUD_PROJECT_ID" \
  --region "$GCLOUD_REGION" \
  --allow-unauthenticated \
  --set-env-vars "$(join_by , "${env_vars[@]}")"

api_url="$(gcloud run services describe "$CLOUD_RUN_SERVICE" --project "$GCLOUD_PROJECT_ID" --region "$GCLOUD_REGION" --format='value(status.url)')"
printf '[%s] API URL: %s\n' "$SCRIPT_NAME" "$api_url"
