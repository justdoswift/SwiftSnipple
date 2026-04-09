.PHONY: dev stop build start logs

dev:
	bash scripts/dev.sh

stop:
	bash scripts/stop.sh

build:
	bash scripts/build.sh

start:
	bash scripts/start.sh

logs:
	docker compose logs -f
