# ChirpStack Platform

Production-grade IoT platform built around ChirpStack.

## Goals
- Control-plane / data-plane separation
- High reliability and observability
- Automation-first operations
- Multi-tenant & multi-site ready

## Quick Start
```bash
cp .env.example .env
docker compose up -d
```

If you hit a port collision, override the published host ports in `.env` and retry:
- Postgres `5432` collision: set `CS_POSTGRES_PORT` (e.g. `CS_POSTGRES_PORT=5433`)
- Grafana `3000` collision: set `GRAFANA_PORT` (e.g. `GRAFANA_PORT=3001`) and update `GRAFANA_URL`

Deploying to an Ubuntu VM: see `docs/deploy-ubuntu-vm.md:1`.

Optional services:
- ChirpStack Explorer UI: `docker compose --profile explorer up -d chirpstack_explorer` (configure via `.env.example`).

See /docs for full architecture and runbooks.
