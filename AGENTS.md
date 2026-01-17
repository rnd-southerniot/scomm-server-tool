# Repository Guidelines

## Project Structure & Module Organization
- `control-plane/chirpstack/`: ChirpStack services and configuration (`config/chirpstack.toml`, `config/gateway-bridge.toml`).
- `data-plane/mqtt/`: Mosquitto broker compose file and `mosquitto.conf`.
- `observability/`: Prometheus, Alertmanager, and Grafana compose files plus dashboards and rules.
- `docker-compose.yml`: Top-level stack that composes all modules.
- `docs/`: Architecture diagrams and runbooks (e.g. `docs/runbooks.md`).
- `scripts/`: Operational utilities such as `scripts/preflight.sh`.

## Architecture Overview
- Control plane (ChirpStack + Postgres + Redis) handles device and application management.
- Data plane (Mosquitto) handles MQTT traffic for gateways and integrations.
- Observability stack (Prometheus, Grafana, Alertmanager) monitors services and infra exporters.
- High-level diagrams live in `docs/architecture.mmd` and `docs/dataflow.mmd`.

## Build, Test, and Development Commands
- `make up`: Start the full stack via Docker Compose.
- `make down`: Stop and remove containers.
- `make logs`: Tail stack logs for debugging.
- `./scripts/preflight.sh`: Validate Docker/Compose availability and render the final compose config.
- `docker compose up -d`: Direct alternative to `make up` for running locally.

## Coding Style & Naming Conventions
- Use the existing formatting in each file type: YAML (2-space indent), TOML and INI-style config keys, and shell scripts with `set -euo pipefail` where appropriate.
- Keep service and file names descriptive and aligned with compose service keys (e.g. `gateway_bridge`, `postgres_exporter`).
- Prefer lowercase, hyphenated filenames for docs (e.g. `docs/deploy-ubuntu-vm.md`).

## Testing Guidelines
- There is no formal unit test framework in this repo.
- Use `./scripts/preflight.sh` for basic validation and run the stack with `make up` for smoke checks.
- When changing ports or bindings, verify `.env` settings and rerun `docker compose config` to confirm the rendered output.
- Smoke checks: Grafana at `http://localhost:${GRAFANA_PORT:-3000}`, ChirpStack API at `http://localhost:8080`, and MQTT on `localhost:1883`.

## Commit & Pull Request Guidelines
- Follow the existing Git history style: short, imperative summaries (e.g. "Add infra exporters and Prometheus alerts").
- Keep commits focused on a single logical change.
- Pull requests should include: a concise description, any relevant docs updates, and notes on config changes or new ports.

## Release & Deployment
- Local dev uses `docker compose up -d` with `.env` overrides for ports.
- VM deployment steps and bind-address guidance are in `docs/deploy-ubuntu-vm.md`.
- For host metrics on Linux, enable the `host-metrics` profile in Compose.

## Security & Configuration Tips
- Use `.env` to override exposed ports (e.g. `CS_POSTGRES_PORT=5433`).
- For VM deployments, bind internal services to localhost as noted in `scripts/preflight.sh` and `docs/deploy-ubuntu-vm.md`.
