up:
	docker compose up -d

up-chirpstack:
	docker compose -f docker-compose.yml -f docker-compose.chirpstack.yml up -d

down:
	docker compose down

down-chirpstack:
	docker compose -f docker-compose.yml -f docker-compose.chirpstack.yml down

logs:
	docker compose logs -f

preflight:
	./scripts/preflight.sh
