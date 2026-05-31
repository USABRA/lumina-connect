"""Phase 2 schema validation tests (no database required)."""

from datetime import date, datetime

from app.enums import ProductStatus, SubscriptionPlan, UserRole
from app.schemas import (
    CampaignCreate,
    CampaignRead,
    CompanyCreate,
    CompanyRead,
    InteractionCreate,
    InteractionRead,
    LeadCreate,
    LeadRead,
    ProductCreate,
    ProductRead,
    UserCreate,
    UserRead,
)


def test_company_schema_roundtrip():
    created = CompanyCreate(company_name="Test Co", subscription_plan=SubscriptionPlan.PRO)
    read = CompanyRead(id=1, **created.model_dump())
    assert read.company_name == "Test Co"
    assert read.subscription_plan == SubscriptionPlan.PRO


def test_user_schema_roles():
    admin = UserCreate(name="Admin", email="a@test.com", role=UserRole.ADMIN)
    assert admin.role == UserRole.ADMIN


def test_campaign_schema_dates():
    campaign = CampaignCreate(
        company_id=1,
        name="Trade Show",
        start_date=date(2026, 3, 10),
        end_date=date(2026, 3, 14),
    )
    read = CampaignRead(id=1, **campaign.model_dump())
    assert read.name == "Trade Show"


def test_product_schema():
    product = ProductCreate(
        campaign_id=1,
        unique_code="ABC123",
        product_type="NFC Business Card",
        qr_url="https://app.luminaconnect.com/p/ABC123",
    )
    read = ProductRead(id=1, **product.model_dump())
    assert read.status == ProductStatus.ACTIVE


def test_interaction_schema():
    interaction = InteractionRead(
        id=1,
        product_id=1,
        timestamp=datetime(2026, 5, 30, 12, 0, 0),
        city="Miami",
        country="US",
        device_type="mobile",
        ip_address="127.0.0.1",
    )
    assert interaction.city == "Miami"


def test_lead_schema():
    lead = LeadCreate(
        product_id=1,
        name="Jane",
        email="jane@example.com",
        phone="+1 555-0100",
        company="Acme",
    )
    read = LeadRead(id=1, **lead.model_dump())
    assert read.email == "jane@example.com"
