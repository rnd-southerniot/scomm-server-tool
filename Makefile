up:
	docker compose up -d

up-chirpstack:
	docker compose -f docker-compose.yml -f docker-compose.chirpstack.yml up -d

up-explorer:
	docker compose --profile explorer up -d chirpstack_explorer

build-explorer:
	docker compose --profile explorer build chirpstack_explorer

up-host-metrics:
	docker compose --profile host-metrics up -d node_exporter

down:
	docker compose down

down-chirpstack:
	docker compose -f docker-compose.yml -f docker-compose.chirpstack.yml down

stop-explorer:
	docker compose --profile explorer stop chirpstack_explorer

stop-host-metrics:
	docker compose --profile host-metrics stop node_exporter

logs:
	docker compose logs -f

preflight:
	./scripts/preflight.sh
