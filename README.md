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

To also run ChirpStack + Gateway Bridge locally:

```bash
docker compose -f docker-compose.yml -f docker-compose.chirpstack.yml up -d
```

If you hit a port collision, override the published host ports in `.env` and retry:
- Postgres `5432` collision: set `CS_POSTGRES_PORT` (e.g. `CS_POSTGRES_PORT=5433`)
- Grafana `3000` collision: set `GRAFANA_PORT` (e.g. `GRAFANA_PORT=3001`) and update `GRAFANA_URL`

## Secrets & Credentials (Phase 0 Hardening)
This stack uses file-based Docker secrets for credentials. Create these files locally and **do not commit them**:

```
secrets/chirpstack_explorer_token
secrets/chirpstack_explorer_app_password
secrets/chirpstack_explorer_session_secret
secrets/postgres_password
secrets/postgres_user
secrets/postgres_db
secrets/grafana_admin_password
```

MQTT auth is enabled. Create `data-plane/mqtt/passwords` using `mosquitto_passwd` and ensure it is readable by the container:

```bash
docker run --rm -v "$PWD/data-plane/mqtt:/mosquitto/config" eclipse-mosquitto:2 \
  mosquitto_passwd -b /mosquitto/config/passwords <user> <password>
chown 1883:1883 data-plane/mqtt/passwords
chmod 640 data-plane/mqtt/passwords
```

Postgres backups run nightly to `/srv/backups` via `scripts/backup-postgres.sh` (cron is installed at `/etc/cron.d/scomm-postgres-backup`).

Deploying to an Ubuntu VM: see `docs/deploy-ubuntu-vm.md:1`.

Optional services:
- ChirpStack Explorer UI: `docker compose --profile explorer up -d chirpstack_explorer` (configure via `.env.example`).
- Host metrics exporter (Linux): `docker compose --profile host-metrics up -d node_exporter`.

See /docs for full architecture and runbooks.
