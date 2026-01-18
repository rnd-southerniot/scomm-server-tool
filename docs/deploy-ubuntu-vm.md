# Deploy on an Ubuntu VM

This repo uses Docker Compose to run the stack. These steps “prepare” a clean Ubuntu VM and give you sane defaults for production-style deployment.

## 1) VM prerequisites

- Ubuntu 22.04+ recommended
- DNS / static IP for the VM (optional, but recommended)
- Open firewall ports only for what you need (see below)

## 2) Install Docker + Compose plugin

Use the official Docker Engine install method for Ubuntu (recommended), then verify:

```bash
docker --version
docker compose version
```

## 3) Clone the repo on the VM

```bash
git clone git@github.com:rnd-southerniot/scomm-server-tool.git
cd scomm-server-tool
```

## 4) Create `.env` on the VM

```bash
cp .env.example .env
```

Minimum changes to make for a VM deployment:

- Set strong secrets:
  - `CS_POSTGRES_PASSWORD`
  - `GRAFANA_ADMIN_PASSWORD`
- Consider binding internal services to localhost:
  - `CS_POSTGRES_BIND_ADDR=127.0.0.1`
  - `CS_REDIS_BIND_ADDR=127.0.0.1`
  - `PROM_BIND_ADDR=127.0.0.1`
  - `ALERTMGR_BIND_ADDR=127.0.0.1`

If this VM will run ChirpStack and you’ll access it remotely:

- Set `CS_HTTP_BIND_ADDR=0.0.0.0` and choose `CS_HTTP_PORT` as desired.
- Open `CS_GWB_UDP_PORT` (default `1700/udp`) if you have gateways.

## 4.1) Create secrets (Phase 0 hardening)

This stack uses file-based Docker secrets. Create these files on the VM and **do not commit them**:

```
secrets/chirpstack_explorer_token
secrets/chirpstack_explorer_app_password
secrets/chirpstack_explorer_session_secret
secrets/postgres_password
secrets/postgres_user
secrets/postgres_db
secrets/grafana_admin_password
```

MQTT auth is enabled. Create the password file:

```bash
docker run --rm -v "$PWD/data-plane/mqtt:/mosquitto/config" eclipse-mosquitto:2 \
  mosquitto_passwd -b /mosquitto/config/passwords <user> <password>
chown 1883:1883 data-plane/mqtt/passwords
chmod 640 data-plane/mqtt/passwords
```

## 5) Start the stack

Start the base stack:

```bash
docker compose up -d
```

To also run ChirpStack + Gateway Bridge on this VM:

```bash
docker compose -f docker-compose.yml -f docker-compose.chirpstack.yml up -d
```

Optional: ChirpStack Explorer UI

This repo can run an optional “ChirpStack Explorer” container as the `chirpstack_explorer` service, but **you must provide a real image** (e.g., a registry tag). The default image name (`chirpstack-tenants-dashboard-chirpstack-explorer`) only exists if you built it locally.

1) Set the required env vars in `.env` (do not commit secrets):
   - `CHIRPSTACK_EXPLORER_IMAGE`
   - `CHIRPSTACK_EXPLORER_BASE_URL` (usually `http://127.0.0.1:8090` on the VM if ChirpStack REST API is local)
   - `CHIRPSTACK_EXPLORER_TOKEN`
   - `CHIRPSTACK_EXPLORER_SESSION_SECRET`

2) Start it:

```bash
docker compose --profile explorer up -d chirpstack_explorer
```

Explorer provisioning requires a ChirpStack API key with write permissions. Store it in `secrets/chirpstack_explorer_token`.

If you want host-level metrics on Linux, enable the optional profile:

```bash
docker compose --profile host-metrics up -d node_exporter
```

Makefile equivalents:

```bash
make up-explorer
make up-host-metrics
```

## 6) Verify

```bash
docker compose ps
docker compose logs -f --tail 200
```

Optional preflight (prints published ports from the rendered config):

```bash
make preflight
```

## 7) Backups

Postgres backups run nightly to `/srv/backups` via `scripts/backup-postgres.sh` (cron installed at `/etc/cron.d/scomm-postgres-backup`).

## 8) Rotate secrets

Update secret files under `secrets/` and the MQTT password file, then restart:

```bash
docker compose -f docker-compose.yml up -d
docker compose --profile explorer up -d chirpstack_explorer
```

## Ports to consider

Only expose what you need:

- MQTT: `1883/tcp` (if gateways/devices connect to this VM)
- Semtech UDP: `1700/udp` (if you use it)
- ChirpStack UI/API: `CS_HTTP_PORT` (default `8090` -> container `8080`)
- Grafana: `GRAFANA_PORT` (default `3000`)

Recommended to keep private (bind to `127.0.0.1` and access via SSH tunnel / reverse proxy):

- Postgres: `CS_POSTGRES_PORT` (default `5432`)
- Redis: `CS_REDIS_PORT` (default `6379`)
- Prometheus: `PROM_PORT` (default `9090`)
- Alertmanager: `ALERTMGR_PORT` (default `9093`)
