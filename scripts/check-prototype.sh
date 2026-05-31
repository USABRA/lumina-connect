#!/usr/bin/env bash
# Quick health check for the local prototype
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ok() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; exit 1; }

echo "Lumina Connect — prototype check"
echo ""

[ -f backend/.env ] && ok "backend/.env" || fail "backend/.env missing — run: bash scripts/setup-prototype.sh"
[ -f frontend/.env.local ] && ok "frontend/.env.local" || fail "frontend/.env.local missing"

pg_isready -h localhost -p 5432 >/dev/null 2>&1 && ok "PostgreSQL running" || fail "PostgreSQL not running"

if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
  ok "Backend http://localhost:8000"
else
  echo "  ✗ Backend not running — run: make backend-dev"
fi

if curl -sf http://localhost:3000 >/dev/null 2>&1; then
  ok "Frontend http://localhost:3000"
else
  echo "  ✗ Frontend not running — run: make frontend-dev"
fi

if curl -sf http://localhost:8000/health/db | grep -q '"phase2_ready":true'; then
  ok "Database seeded (phase2_ready)"
else
  echo "  ✗ Database not ready — run: make db-setup"
fi

echo ""
echo "Done."
