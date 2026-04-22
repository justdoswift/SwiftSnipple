.PHONY: dev stop build start restart logs deploy deploy-web deploy-api deploy-check

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

deploy-check:
	bash scripts/deploy-check.sh

deploy-api:
	bash scripts/deploy-api.sh

deploy-web:
	bash scripts/deploy-web.sh

deploy:
	bash scripts/deploy.sh
