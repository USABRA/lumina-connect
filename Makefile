.PHONY: db-up db-setup db-migrate db-seed db-verify db-reset backend-dev frontend-dev dev dev-status dev-stop dev-restart dev-up test prototype-setup prototype-check

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
	@bash scripts/dev.sh start --backend-only

frontend-dev:
	@bash scripts/dev.sh start --frontend-only

dev:
	@bash scripts/dev.sh start

dev-status:
	@bash scripts/dev.sh status

dev-stop:
	@bash scripts/dev.sh stop

dev-restart:
	@bash scripts/dev.sh start --restart --detach

dev-up:
	@bash scripts/dev.sh start --detach

prototype-setup:
	bash scripts/setup-prototype.sh

prototype-check:
	bash scripts/check-prototype.sh

test:
	cd backend && source .venv/bin/activate && pytest -q
