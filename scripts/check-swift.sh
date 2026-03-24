#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE_SWIFT_DIR="$ROOT_DIR/packages/snippet-schema/fixtures/valid/basic-card-feed/Code/SwiftUI"

if command -v swift-format >/dev/null 2>&1; then
  SWIFT_FORMAT_CMD=(swift-format)
elif swift format --help >/dev/null 2>&1; then
  SWIFT_FORMAT_CMD=(swift format)
else
  echo "swift-format is required but not installed." >&2
  echo "Install it before running Swift checks." >&2
  exit 1
fi

if ! command -v swiftlint >/dev/null 2>&1; then
  echo "swiftlint is required but not installed." >&2
  echo "Install it before running Swift checks." >&2
  exit 1
fi

"${SWIFT_FORMAT_CMD[@]}" lint --strict --recursive "$FIXTURE_SWIFT_DIR"
swiftlint lint --config "$ROOT_DIR/.swiftlint.yml" --path "$FIXTURE_SWIFT_DIR"
swift build --package-path "$FIXTURE_SWIFT_DIR"
