#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -d .venv ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo "Running migrations..."
alembic upgrade head

echo "Seeding demo data..."
python scripts/seed.py

echo "Verifying database..."
python scripts/verify_db.py

echo ""
echo "Phase 2 database is ready."
