from __future__ import annotations

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.enums import SubscriptionPlan


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    subscription_plan: Mapped[SubscriptionPlan] = mapped_column(
        Enum(SubscriptionPlan, native_enum=False),
        default=SubscriptionPlan.FREE,
        nullable=False,
    )

    users: Mapped[list["User"]] = relationship(back_populates="company")
    campaigns: Mapped[list["Campaign"]] = relationship(back_populates="company")
