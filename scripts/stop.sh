#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="${PID_FILE:-$ROOT_DIR/.swiftsnippet.pids}"

if [[ -f "$PID_FILE" ]]; then
	while IFS= read -r pid; do
		if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
			echo "Stopping process pid $pid"
			kill "$pid" || true
		fi
	done <"$PID_FILE"

	rm -f "$PID_FILE"
	exit 0
fi

echo "No pid file ($PID_FILE) found. Nothing to stop."
