#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

echo "== scomm-server-tool preflight =="
echo "Repo: $repo_root"
echo "Time: $(date -Is)"
echo

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker not found. Install Docker Engine first."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose plugin not available. Install the Compose plugin."
  exit 1
fi

tmp="${TMPDIR:-/tmp}/scomm-compose-config.$$"
trap 'rm -f "$tmp"' EXIT

docker compose config >"$tmp"

echo "Rendered compose config: $tmp"
echo

echo "Published ports (from rendered config):"
awk '
  $1=="published:" { gsub(/"/,"",$2); print " - " $2 }
' "$tmp" | sort -u

echo
echo "Tip: bind internal services to localhost on a VM by setting e.g. CS_POSTGRES_BIND_ADDR=127.0.0.1"
