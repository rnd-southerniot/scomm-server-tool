# Session Summary

## Overview
- Hardened the stack with secrets, MQTT auth, backups, and health checks.
- Built and integrated the ChirpStack Explorer app, redesigned the UI to match the CRM-style dashboard, and added provisioning functionality via REST.
- Updated documentation to reflect secrets, backups, and provisioning.

## Key Changes (Repo)
- Added ChirpStack Explorer source under `chirpstack-explorer/` and integrated it into `docker-compose.yml`.
- Enforced MQTT auth and mounted the password file in `data-plane/mqtt/`.
- Added file-based secrets for Explorer, Postgres, and Grafana; wired services to read from `/run/secrets`.
- Added `scripts/backup-postgres.sh` with a daily cron at `/etc/cron.d/scomm-postgres-backup`.
- Added `scripts/health-check.sh` and `make health`.
- Updated Explorer UI layout (sidebar + KPI cards) and added a Provision modal for:
  - Create Tenant, Application, Device Profile, Gateway, Device, Device Keys
- Added Explorer REST proxy POST endpoints for the above provisioning actions.
- Updated README and VM deployment docs for secrets, MQTT auth, backups, health checks, and provisioning.

## Health Checks
- `make health` verifies Postgres, Redis, Prometheus, Alertmanager, Grafana, exporters, and Explorer.

## Secrets/Files Created (local only)
- `secrets/` directory with file-based secrets (Explorer token/session/app password, Postgres user/db/password, Grafana admin password).
- `data-plane/mqtt/passwords` file for MQTT auth.

## Services and Access
- Base stack started with `docker compose -f docker-compose.yml up -d`.
- Explorer started with `docker compose --profile explorer up -d chirpstack_explorer`.
- Explorer UI: `http://<host>:3002`.

## Recent Commits (high-level)
- Added Explorer app and build targets, deterministic npm lockfile, `.dockerignore`.
- Phase 0 hardening: secrets, MQTT auth, backups.
- Added health-check script + Makefile target.
- Updated docs for secrets/rotation/provisioning.
- Dashboard redesign and Provision modal + REST endpoints.

## Notes / Next Steps
- Provisioning uses REST; ensure the Explorer token has write permissions in ChirpStack.
- MQTT exporter now uses MQTT credentials from `.env` for broker access.
- Phase 1 (reverse proxy, logging, alerting, release hygiene) deferred.
