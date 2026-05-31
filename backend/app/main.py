from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, get_db
from app.services.db_stats import get_db_stats

from app.routers import analytics, auth, campaigns, leads, products, tracking

app = FastAPI(
    title="Lumina Connect API",
    description="Backend API for Lumina Connect MVP",
    version="0.7.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(campaigns.router)
app.include_router(products.router)
app.include_router(tracking.router)
app.include_router(analytics.router)
app.include_router(leads.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "lumina-connect-api"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)) -> dict:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))

    tables = set(inspect(engine).get_table_names())
    expected = {"companies", "users", "campaigns", "products", "interactions", "leads"}
    missing = sorted(expected - tables)

    stats = get_db_stats(db)
    ready = not missing and stats["companies"] > 0

    return {
        "status": "ok" if not missing else "degraded",
        "database": "connected",
        "phase2_ready": ready,
        "tables": sorted(tables & expected),
        "missing_tables": missing,
        "counts": stats,
    }
