from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.auth.dependencies import get_current_user_flexible
from app.config import settings
from app.database import get_db
from app.enums import ProductStatus
from app.models import Campaign, Product, User
from app.schemas import LandingPageUpdate, ProductRead
from app.services.access import get_company_campaign, get_company_product, require_company
from app.services.codes import generate_unique_code
from app.services.product_access import require_active_product

router = APIRouter(prefix="/products", tags=["products"])

LANDING_TEMPLATES = frozenset({"showcase", "split", "trade_show", "media_center", "brand_story", "custom"})

PRODUCT_TYPES = [
    "NFC Business Card",
    "Smart Coaster",
    "Event Badge",
    "Promotional Giveaway",
    "Product Tag",
]


class ProductUpdate(BaseModel):
    product_type: Optional[str] = Field(default=None, min_length=1, max_length=100)
    status: Optional[ProductStatus] = None


class ProductCreateRequest(BaseModel):
    campaign_id: int
    product_type: str = Field(min_length=1, max_length=100)
    unique_code: Optional[str] = Field(default=None, min_length=4, max_length=100)
    landing: Optional[LandingPageUpdate] = None


class ProductPublicRead(BaseModel):
    unique_code: str
    product_type: str
    qr_url: Optional[str] = None
    campaign_name: str
    company_name: str
    landing_headline: Optional[str] = None
    landing_description: Optional[str] = None
    logo_url: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    meeting_url: Optional[str] = None
    contact_form_enabled: bool = True
    landing_template: str = "showcase"
    primary_color: Optional[str] = None
    hero_image_url: Optional[str] = None
    highlight_1: Optional[str] = None
    highlight_2: Optional[str] = None
    highlight_3: Optional[str] = None
    landing_blocks: Optional[list] = None


def _apply_landing(product: Product, landing: LandingPageUpdate) -> None:
    updates = landing.model_dump(exclude_unset=True)
    if "landing_template" in updates and updates["landing_template"] not in LANDING_TEMPLATES:
        raise HTTPException(status_code=400, detail="Invalid landing template")
    for field, value in updates.items():
        setattr(product, field, value)


def _product_public(product: Product) -> ProductPublicRead:
    headline = product.landing_headline or product.product_type
    return ProductPublicRead(
        unique_code=product.unique_code,
        product_type=product.product_type,
        qr_url=product.qr_url,
        campaign_name=product.campaign.name,
        company_name=product.campaign.company.company_name,
        landing_headline=headline,
        landing_description=product.landing_description,
        logo_url=product.logo_url,
        video_url=product.video_url,
        pdf_url=product.pdf_url,
        meeting_url=product.meeting_url,
        contact_form_enabled=product.contact_form_enabled,
        landing_template=product.landing_template,
        primary_color=product.primary_color,
        hero_image_url=product.hero_image_url,
        highlight_1=product.highlight_1,
        highlight_2=product.highlight_2,
        highlight_3=product.highlight_3,
        landing_blocks=product.landing_blocks,
    )


class DashboardStats(BaseModel):
    active_campaigns: int
    products_tracked: int
    total_interactions: int
    leads_captured: int


def _build_qr_url(code: str) -> str:
    base = settings.landing_base_url.rstrip("/")
    return f"{base}/{code}"


def _unique_code(db: Session, requested: Optional[str] = None) -> str:
    code = requested or generate_unique_code()
    for _ in range(10):
        exists = db.query(Product.id).filter(Product.unique_code == code).first()
        if not exists:
            return code
        code = generate_unique_code()
    raise HTTPException(status_code=500, detail="Could not generate unique product code")


@router.get("/types", response_model=list[str])
def list_product_types() -> list[str]:
    return PRODUCT_TYPES


@router.get("/stats/dashboard", response_model=DashboardStats)
def dashboard_stats(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> DashboardStats:
    from app.models import Interaction, Lead

    company_id = require_company(user)
    campaign_ids = [
        row[0]
        for row in db.query(Campaign.id).filter(Campaign.company_id == company_id).all()
    ]
    if not campaign_ids:
        return DashboardStats(
            active_campaigns=0,
            products_tracked=0,
            total_interactions=0,
            leads_captured=0,
        )

    product_ids = [
        row[0]
        for row in db.query(Product.id).filter(Product.campaign_id.in_(campaign_ids)).all()
    ]

    active_campaigns = (
        db.query(Campaign)
        .filter(Campaign.company_id == company_id)
        .count()
    )
    products_tracked = len(product_ids)
    total_interactions = (
        db.query(Interaction).filter(Interaction.product_id.in_(product_ids)).count()
        if product_ids
        else 0
    )
    leads_captured = (
        db.query(Lead).filter(Lead.product_id.in_(product_ids)).count() if product_ids else 0
    )

    return DashboardStats(
        active_campaigns=active_campaigns,
        products_tracked=products_tracked,
        total_interactions=total_interactions,
        leads_captured=leads_captured,
    )


@router.get("", response_model=list[ProductRead])
def list_products(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
    campaign_id: Annotated[Optional[int], Query()] = None,
) -> list[ProductRead]:
    company_id = require_company(user)
    query = db.query(Product).join(Campaign).filter(Campaign.company_id == company_id)
    if campaign_id is not None:
        get_company_campaign(db, campaign_id, company_id)
        query = query.filter(Product.campaign_id == campaign_id)
    products = query.order_by(Product.id.desc()).all()
    return [ProductRead.model_validate(p) for p in products]


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    body: ProductCreateRequest,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> ProductRead:
    company_id = require_company(user)
    get_company_campaign(db, body.campaign_id, company_id)

    code = _unique_code(db, body.unique_code.upper() if body.unique_code else None)
    product = Product(
        campaign_id=body.campaign_id,
        unique_code=code,
        product_type=body.product_type,
        qr_url=_build_qr_url(code),
        status=ProductStatus.ACTIVE,
    )
    if body.landing:
        _apply_landing(product, body.landing)
    db.add(product)
    db.commit()
    db.refresh(product)
    return ProductRead.model_validate(product)


@router.get("/by-code/{unique_code}", response_model=ProductPublicRead)
def get_product_by_code(
    unique_code: str,
    db: Annotated[Session, Depends(get_db)],
) -> ProductPublicRead:
    product = (
        db.query(Product)
        .options(joinedload(Product.campaign).joinedload(Campaign.company))
        .filter(Product.unique_code == unique_code.upper())
        .one_or_none()
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    require_active_product(product)

    return _product_public(product)


@router.put("/{product_id}/landing", response_model=ProductRead)
def update_landing_page(
    product_id: int,
    body: LandingPageUpdate,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> ProductRead:
    company_id = require_company(user)
    product = get_company_product(db, product_id, company_id)
    _apply_landing(product, body)
    db.commit()
    db.refresh(product)
    return ProductRead.model_validate(product)


@router.get("/{product_id}", response_model=ProductRead)
def get_product(
    product_id: int,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> ProductRead:
    company_id = require_company(user)
    product = get_company_product(db, product_id, company_id)
    return ProductRead.model_validate(product)


@router.put("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    body: ProductUpdate,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> ProductRead:
    company_id = require_company(user)
    product = get_company_product(db, product_id, company_id)

    if body.product_type is not None:
        product.product_type = body.product_type
    if body.status is not None:
        product.status = body.status

    db.commit()
    db.refresh(product)
    return ProductRead.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    company_id = require_company(user)
    product = get_company_product(db, product_id, company_id)
    db.delete(product)
    db.commit()
