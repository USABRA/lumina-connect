from __future__ import annotations

from app.enums import ProductStatus
from app.models import Product
from fastapi import HTTPException


def require_active_product(product: Product) -> None:
    if product.status != ProductStatus.ACTIVE:
        raise HTTPException(status_code=410, detail="Product is not available")
