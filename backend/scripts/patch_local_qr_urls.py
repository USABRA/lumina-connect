"""Point all product QR URLs to the local landing base URL."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings
from app.database import SessionLocal
from app.models import Product


def main() -> None:
    base = settings.landing_base_url.rstrip("/")
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        for product in products:
            product.qr_url = f"{base}/{product.unique_code}"
        db.commit()
        print(f"Updated {len(products)} product QR URLs → {base}/{{code}}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
