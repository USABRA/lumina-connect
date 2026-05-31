#!/usr/bin/env bash
# Lumina Connect — one-time local prototype setup (macOS / Linux)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { echo -e "\n${GREEN}▸${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }

step "Checking prerequisites…"
command -v node >/dev/null || { echo "Node.js required. Install from https://nodejs.org"; exit 1; }
command -v python3 >/dev/null || { echo "Python 3 required."; exit 1; }
command -v psql >/dev/null || { echo "PostgreSQL client (psql) required."; exit 1; }

if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
  warn "PostgreSQL is not running on localhost:5432"
  echo "  macOS: brew services start postgresql@16"
  echo "  Docker: docker compose up -d"
  exit 1
fi

step "Ensuring database exists…"
if ! psql -h localhost -U lumina -d lumina_connect -c "SELECT 1" >/dev/null 2>&1; then
  warn "Database lumina_connect or user lumina not found — creating…"
  createdb lumina_connect 2>/dev/null || true
  psql -d postgres -c "CREATE USER lumina WITH PASSWORD 'lumina';" 2>/dev/null || true
  psql -d lumina_connect -c "GRANT ALL PRIVILEGES ON DATABASE lumina_connect TO lumina; GRANT ALL ON SCHEMA public TO lumina;" 2>/dev/null || true
fi

step "Backend environment…"
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "  Created backend/.env"
fi
grep -q "LANDING_BASE_URL" backend/.env || echo "LANDING_BASE_URL=http://localhost:3000/p" >> backend/.env

step "Frontend environment…"
if [ ! -f frontend/.env.local ]; then
  cp frontend/.env.example frontend/.env.local
  echo "  Created frontend/.env.local"
fi

step "Python venv + dependencies…"
cd backend
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

step "Database migrations + seed…"
alembic upgrade head
python scripts/seed.py

step "Local QR URLs…"
python scripts/patch_local_qr_urls.py
python scripts/verify_db.py
cd "$ROOT"

step "Frontend dependencies…"
cd frontend
if [ ! -d node_modules ]; then
  npm install
fi
cd "$ROOT"

echo ""
echo -e "${GREEN}✓ Prototype ready${NC}"
echo ""
echo "  Start in two terminals:"
echo "    make backend-dev    → http://localhost:8000"
echo "    make frontend-dev   → http://localhost:3000"
echo ""
echo "  Quick test:"
echo "    Dashboard   http://localhost:3000"
echo "    API docs    http://localhost:8000/docs"
echo "    Health      http://localhost:8000/health/db"
echo ""
echo "  Dev mode: no Firebase needed — dashboard opens automatically."
echo "  See PROTOTIPO.md for the full walkthrough."
