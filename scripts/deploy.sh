#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="deploy"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

printf '\n[%s] Running deploy checks\n' "$SCRIPT_NAME"
bash "$ROOT_DIR/scripts/deploy-check.sh"

printf '\n[%s] Deploying API\n' "$SCRIPT_NAME"
bash "$ROOT_DIR/scripts/deploy-api.sh"

printf '\n[%s] Deploying web\n' "$SCRIPT_NAME"
bash "$ROOT_DIR/scripts/deploy-web.sh"

printf '[%s] Deployment finished\n' "$SCRIPT_NAME"
