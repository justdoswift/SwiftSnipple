.PHONY: dev stop build start restart logs

dev:
	bash scripts/dev.sh

stop:
	bash scripts/stop.sh

build:
	bash scripts/build.sh

start:
	bash scripts/start.sh

restart:
	bash scripts/restart.sh

logs:
	docker compose logs -f
