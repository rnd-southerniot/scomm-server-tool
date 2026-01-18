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

Common commands:

```bash
make up
make down
make logs
make health
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

### Secrets Rotation
Rotate secrets by updating files under `secrets/` (and `data-plane/mqtt/passwords`), then restart services:

```bash
docker compose -f docker-compose.yml up -d
docker compose --profile explorer up -d chirpstack_explorer
```

### Health Checks
`make health` requires `jq` to be installed (used for Prometheus targets).

### Explorer Dashboard & Provisioning
The Explorer UI runs at `http://<host>:3002` and supports:
- Tenants, Applications, Devices, Gateways browsing.
- Provisioning via the Provision modal:
  - Create Tenant: name, description
  - Create Application: name (tenant is taken from selected tenant)
  - Create Device Profile: name, region, LoRaWAN version
  - Add Gateway: name, gateway EUI
  - Add Device: name, devEUI, device profile ID, optional app key

Requirements:
- `CHIRPSTACK_EXPLORER_BASE_URL` points to ChirpStack REST API.
- `CHIRPSTACK_EXPLORER_TOKEN` is a ChirpStack API key with provisioning rights (stored in `secrets/`).

Deploying to an Ubuntu VM: see `docs/deploy-ubuntu-vm.md:1`.

### First-Run Verification
- Grafana: `http://localhost:${GRAFANA_PORT:-3000}`
- ChirpStack API: `http://localhost:8080`
- Explorer UI: `http://localhost:3002`
- MQTT: `localhost:1883`

Optional services:
- ChirpStack Explorer UI: `docker compose --profile explorer up -d chirpstack_explorer` (configure via `.env.example`).
- Host metrics exporter (Linux): `docker compose --profile host-metrics up -d node_exporter`.

See /docs for full architecture and runbooks.

## Phase-Wise Upgrades & Improvements
Phase 0: Hardening
- Verify secrets are present and not committed (see `secrets/` list above).
- Confirm MQTT passwords are set and permissions are correct.
- Ensure backups are scheduled and landing in `/srv/backups`.

Phase 1: Developer Experience
- Prefer `make up/down/logs/health` for consistent local workflows.
- Add `.env` overrides for ports if needed (see Quick Start).

Phase 2: Provisioning UX
- Select a tenant before creating applications, device profiles, or gateways.
- Select an application before creating devices.
- Use valid IDs: devEUI/gateway EUI are 16 hex chars; device profile ID is UUID.

Phase 3: Observability
- Validate Prometheus targets and Grafana dashboards after `make up`.
- Enable `host-metrics` profile on Linux for host-level metrics.

Phase 4: Security & Ops
- Review exposed ports and bind services appropriately in `.env`.
- Rotate secrets periodically and restart services after rotation.

Phase 5: Deployment Scale
- Use `docs/deploy-ubuntu-vm.md` for VM guidance and bind-address notes.
- Document any site-specific overrides and keep them in `.env`.
