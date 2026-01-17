#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

pg_user="$(cat "$repo_root/secrets/postgres_user" 2>/dev/null || echo chirpstack)"
pg_db="$(cat "$repo_root/secrets/postgres_db" 2>/dev/null || echo chirpstack)"

printf 'Postgres: '
docker compose exec -T postgres pg_isready -U "$pg_user" -d "$pg_db"

printf 'Redis: '
docker compose exec -T redis redis-cli ping

printf 'Prometheus: '
curl -sf http://127.0.0.1:9090/-/healthy >/dev/null && echo OK

printf 'Alertmanager: '
curl -sf http://127.0.0.1:9093/-/healthy >/dev/null && echo OK

printf 'Grafana: '
curl -sf http://127.0.0.1:3000/api/health | cat

printf 'Postgres exporter: '
curl -sf http://127.0.0.1:9187/metrics >/dev/null && echo OK

printf 'Redis exporter: '
curl -sf http://127.0.0.1:9121/metrics >/dev/null && echo OK

printf 'Mosquitto exporter: '
curl -sf http://127.0.0.1:9234/metrics >/dev/null && echo OK

printf 'Explorer: '
curl -sf http://127.0.0.1:3002/ >/dev/null && echo OK
