#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="/srv/backups"

mkdir -p "$backup_dir"

if [[ -f "$repo_root/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$repo_root/.env"
  set +a
fi

db_name="${CS_POSTGRES_DB:-chirpstack}"
db_user="${CS_POSTGRES_USER:-chirpstack}"
timestamp="$(date -u +%F-%H%M%S)"
outfile="$backup_dir/chirpstack-${timestamp}.sql"

docker compose -f "$repo_root/docker-compose.yml" exec -T postgres \
  pg_dump -U "$db_user" "$db_name" >"$outfile"

gzip -f "$outfile"
find "$backup_dir" -name 'chirpstack-*.sql.gz' -mtime +7 -delete
