up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

preflight:
	./scripts/preflight.sh
