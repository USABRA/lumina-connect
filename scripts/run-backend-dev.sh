#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"
# shellcheck disable=SC1091
source .venv/bin/activate
alembic upgrade head
exec uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 \
  --reload-exclude 'alembic/*' \
  --reload-exclude 'tests/*' \
  --reload-exclude 'scripts/*' \
  --reload-exclude '.venv/*'
