#!/usr/bin/env bash
# Local dev server manager — idempotent start, no accidental kills.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT=8000
FRONTEND_PORT=3000
PID_DIR="$ROOT/.dev"
RESTART=0
MODE="both"
DETACH=0

usage() {
  cat <<'EOF'
Usage: scripts/dev.sh [command] [options]

Commands:
  start     Start backend and/or frontend (default)
  status    Show whether :8000 and :3000 are responding
  stop      Stop dev servers on :8000 and :3000

Options:
  --restart         Kill existing processes on target ports before starting
  --detach          Start in background (survives agent shell exit)
  --backend-only    Only backend (:8000)
  --frontend-only   Only frontend (:3000)
  -h, --help        Show this help

Examples:
  make dev                    # start both (skip if already running)
  scripts/dev.sh status
  scripts/dev.sh --restart    # force restart both
EOF
}

port_pids() {
  lsof -ti ":$1" 2>/dev/null || true
}

port_in_use() {
  [[ -n "$(port_pids "$1")" ]]
}

http_ok() {
  curl -sf "$1" >/dev/null 2>&1
}

stop_port() {
  local port=$1
  local label=$2
  local pids
  pids="$(port_pids "$port")"
  if [[ -z "$pids" ]]; then
    echo "  $label: not running"
    return 0
  fi
  echo "  Stopping $label on :$port..."
  # shellcheck disable=SC2086
  kill -TERM $pids 2>/dev/null || true
  sleep 1
  pids="$(port_pids "$port")"
  if [[ -n "$pids" ]]; then
    # shellcheck disable=SC2086
    kill -KILL $pids 2>/dev/null || true
  fi
}

maybe_stop_port() {
  local port=$1
  local label=$2
  if port_in_use "$port"; then
    if [[ "$RESTART" -eq 1 ]]; then
      stop_port "$port" "$label"
    else
      echo "  $label already running on http://localhost:$port (use --restart to replace)"
      return 1
    fi
  fi
  return 0
}

start_backend() {
  if ! maybe_stop_port "$BACKEND_PORT" "Backend"; then
    return 1
  fi
  echo "  Starting backend on http://localhost:$BACKEND_PORT ..."
  if [[ "$DETACH" -eq 1 ]]; then
    nohup bash "$ROOT/scripts/run-backend-dev.sh" >>"$PID_DIR/backend.log" 2>&1 &
    echo $! >"$PID_DIR/backend.pid"
  else
    bash "$ROOT/scripts/run-backend-dev.sh" &
    echo $! >"$PID_DIR/backend.pid"
  fi
  return 0
}

start_frontend() {
  if ! maybe_stop_port "$FRONTEND_PORT" "Frontend"; then
    return 1
  fi
  echo "  Starting frontend on http://localhost:$FRONTEND_PORT ..."
  if [[ "$DETACH" -eq 1 ]]; then
    nohup bash -c "cd \"$ROOT/frontend\" && exec npm run dev" >>"$PID_DIR/frontend.log" 2>&1 &
    echo $! >"$PID_DIR/frontend.pid"
  else
    (cd "$ROOT/frontend" && npm run dev) &
    echo $! >"$PID_DIR/frontend.pid"
  fi
  return 0
}

wait_for_health() {
  local url=$1
  local label=$2
  local i
  for i in $(seq 1 30); do
    if http_ok "$url"; then
      echo "  $label ready: $url"
      return 0
    fi
    sleep 1
  done
  echo "  WARNING: $label did not respond at $url within 30s"
  return 1
}

cmd_status() {
  echo "Dev server status:"
  if http_ok "http://localhost:$BACKEND_PORT/health"; then
    echo "  Backend  :8000  OK"
  elif port_in_use "$BACKEND_PORT"; then
    echo "  Backend  :8000  starting (port in use, health check pending)"
  else
    echo "  Backend  :8000  DOWN"
  fi
  if http_ok "http://localhost:$FRONTEND_PORT"; then
    echo "  Frontend :3000  OK"
  elif port_in_use "$FRONTEND_PORT"; then
    echo "  Frontend :3000  starting (port in use, health check pending)"
  else
    echo "  Frontend :3000  DOWN"
  fi
}

cmd_stop() {
  stop_port "$BACKEND_PORT" "Backend"
  stop_port "$FRONTEND_PORT" "Frontend"
  rm -f "$PID_DIR/backend.pid" "$PID_DIR/frontend.pid"
}

cmd_start() {
  mkdir -p "$PID_DIR"
  local started=0

  echo "Lumina Connect dev servers"
  case "$MODE" in
    both)
      start_backend && started=1 || true
      start_frontend && started=1 || true
      ;;
    backend)
      start_backend && started=1 || true
      ;;
    frontend)
      start_frontend && started=1 || true
      ;;
  esac

  if [[ "$started" -eq 0 ]]; then
    echo "  Nothing to start — target servers already running."
    cmd_status
    return 0
  fi

  if [[ "$DETACH" -eq 1 ]]; then
    if [[ "$MODE" != "frontend" ]]; then
      wait_for_health "http://localhost:$BACKEND_PORT/health" "Backend" || true
    fi
    if [[ "$MODE" != "backend" ]]; then
      wait_for_health "http://localhost:$FRONTEND_PORT" "Frontend" || true
    fi
    echo "  Detached — logs in $PID_DIR/*.log (use make dev-stop to stop)"
    return 0
  fi

  trap 'kill $(jobs -p) 2>/dev/null || true; exit 0' INT TERM

  echo ""
  echo "Press Ctrl+C to stop. Servers keep hot-reload on file changes."
  echo "Do not restart from agent shells — edit code and let reload handle it."
  echo ""

  if [[ "$MODE" != "frontend" ]]; then
    wait_for_health "http://localhost:$BACKEND_PORT/health" "Backend" || true
  fi
  if [[ "$MODE" != "backend" ]]; then
    wait_for_health "http://localhost:$FRONTEND_PORT" "Frontend" || true
  fi

  wait
}

# Parse args
CMD="start"
while [[ $# -gt 0 ]]; do
  case "$1" in
    start|status|stop) CMD="$1" ;;
    --restart) RESTART=1 ;;
    --detach) DETACH=1 ;;
    --backend-only) MODE="backend" ;;
    --frontend-only) MODE="frontend" ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
  shift
done

case "$CMD" in
  start) cmd_start ;;
  status) cmd_status ;;
  stop) cmd_stop ;;
esac
