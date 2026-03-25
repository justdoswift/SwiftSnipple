.PHONY: db-up api web dev-all stop

ifneq (,$(wildcard .env))
include .env
export
endif

db-up:
	docker compose -f infra/postgres/docker-compose.yml up -d postgres

api:
	cd apps/api && API_ADDRESS=$${API_ADDRESS:-:$${API_PORT:-18080}} DATABASE_URL="$${DATABASE_URL:-postgres://swiftsnippet:swiftsnippet@127.0.0.1:5432/swiftsnippet?sslmode=disable}" go run ./cmd/api

web:
	if [ ! -d node_modules ]; then pnpm install; fi
	cd apps/web && API_BASE_URL=$${API_BASE_URL:-http://127.0.0.1:$${API_PORT:-18080}} pnpm exec svelte-kit sync && pnpm exec vite dev --host 0.0.0.0 --port $${WEB_PORT:-13000}

dev-all:
	bash scripts/dev.sh

stop:
	bash scripts/stop.sh
