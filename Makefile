.PHONY: db-up db-setup db-migrate db-seed db-verify db-reset backend-dev frontend-dev dev test prototype-setup prototype-check

db-up:
	docker compose up -d

db-setup:
	cd backend && bash scripts/setup_db.sh

db-migrate:
	cd backend && source .venv/bin/activate && alembic upgrade head

db-seed:
	cd backend && source .venv/bin/activate && python scripts/seed.py

db-verify:
	cd backend && source .venv/bin/activate && python scripts/verify_db.py

db-reset:
	cd backend && source .venv/bin/activate && alembic downgrade base && alembic upgrade head && python scripts/seed.py

backend-dev:
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend-dev:
	cd frontend && npm run dev

dev:
	@echo "Start backend and frontend in separate terminals:"
	@echo "  make backend-dev   → http://localhost:8000"
	@echo "  make frontend-dev  → http://localhost:3000"

prototype-setup:
	bash scripts/setup-prototype.sh

prototype-check:
	bash scripts/check-prototype.sh

test:
	cd backend && source .venv/bin/activate && pytest -q
