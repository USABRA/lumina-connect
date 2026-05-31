#!/usr/bin/env bash
# Configure backend/.env Firebase service account fields from a JSON key file.
# Usage: ./scripts/setup-firebase-env.sh /path/to/firebase-adminsdk-xxxxx.json
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/backend/.env"
JSON_PATH="${1:-}"

if [ -z "$JSON_PATH" ]; then
  echo "Usage: $0 /path/to/firebase-adminsdk-xxxxx.json"
  echo ""
  echo "Download the key from Firebase Console:"
  echo "  Project settings → Service accounts → Generate new private key"
  exit 1
fi

if [ ! -f "$JSON_PATH" ]; then
  echo "File not found: $JSON_PATH"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  cp "$ROOT/backend/.env.example" "$ENV_FILE"
  echo "Created backend/.env from .env.example"
fi

python3 - "$JSON_PATH" "$ENV_FILE" "$ROOT" <<'PY'
import json
import re
import sys
from pathlib import Path

json_path = Path(sys.argv[1])
env_path = Path(sys.argv[2])
root = Path(sys.argv[3])

data = json.loads(json_path.read_text())
project_id = data.get("project_id", "").strip()
client_email = data.get("client_email", "").strip()
private_key = data.get("private_key", "").strip()

if not project_id or not client_email or not private_key:
    print("Invalid service account JSON: missing project_id, client_email, or private_key")
    sys.exit(1)

escaped_key = private_key.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")

lines = env_path.read_text().splitlines()
keys = {
    "FIREBASE_PROJECT_ID": project_id,
    "FIREBASE_CLIENT_EMAIL": client_email,
    "FIREBASE_PRIVATE_KEY": f'"{escaped_key}"',
}
seen = set()
out = []
for line in lines:
    matched = False
    for key, value in keys.items():
        if line.startswith(f"{key}="):
            out.append(f"{key}={value}")
            seen.add(key)
            matched = True
            break
    if not matched:
        out.append(line)

for key, value in keys.items():
    if key not in seen:
        out.append(f"{key}={value}")

env_path.write_text("\n".join(out) + "\n")

dest = root / "backend" / ".firebase-service-account.json"
if json_path.resolve() != dest.resolve():
    dest.write_text(json_path.read_text())
    print(f"Copied service account to {dest} (gitignored)")

print("Updated backend/.env:")
print(f"  FIREBASE_PROJECT_ID={project_id}")
print(f"  FIREBASE_CLIENT_EMAIL={client_email}")
print("  FIREBASE_PRIVATE_KEY=(set)")
PY

echo ""
echo "Restart the API and verify:"
echo "  make dev-restart"
echo "  curl -s http://localhost:8000/auth/status"
