from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import Boolean, Enum, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.enums import ProductStatus


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"), nullable=False, index=True)
    unique_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    product_type: Mapped[str] = mapped_column(String(100), nullable=False)
    qr_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[ProductStatus] = mapped_column(
        Enum(ProductStatus, native_enum=False),
        default=ProductStatus.ACTIVE,
        nullable=False,
    )
    landing_headline: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    landing_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    pdf_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    meeting_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    contact_form_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    landing_template: Mapped[str] = mapped_column(String(50), default="showcase", nullable=False)
    primary_color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    hero_image_url: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    highlight_1: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    highlight_2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    highlight_3: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    landing_blocks: Mapped[Optional[list[dict[str, Any]]]] = mapped_column(JSON, nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    whatsapp: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    campaign: Mapped["Campaign"] = relationship(back_populates="products")
    interactions: Mapped[list["Interaction"]] = relationship(back_populates="product")
    leads: Mapped[list["Lead"]] = relationship(back_populates="product")
