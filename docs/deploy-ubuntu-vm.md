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

## 5) Start the stack

Start the full stack:

```bash
docker compose up -d
```

If you want host-level metrics on Linux, enable the optional profile:

```bash
docker compose --profile host-metrics up -d node_exporter
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
