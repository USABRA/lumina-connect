from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.enums import ProductStatus, SubscriptionPlan, UserRole
from app.security.safe_urls import validate_safe_http_url


class CompanyBase(BaseModel):
    company_name: str = Field(min_length=1, max_length=255)
    subscription_plan: SubscriptionPlan = SubscriptionPlan.FREE


class CompanyCreate(CompanyBase):
    pass


class CompanyRead(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    brand_logo_url: Optional[str] = None
    brand_color: Optional[str] = None
    brand_tagline: Optional[str] = None
    brand_website: Optional[str] = None
    brand_phone: Optional[str] = None
    default_meeting_url: Optional[str] = None
    default_pdf_url: Optional[str] = None
    white_label_enabled: bool = False
    hide_platform_branding: bool = False
    brand_display_name: Optional[str] = None
    brand_favicon_url: Optional[str] = None
    brand_secondary_color: Optional[str] = None
    team_structure: Optional[dict[str, Any]] = None


class TeamRoleSchema(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    group_id: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    sort_order: int = 0
    color: Optional[str] = Field(default=None, max_length=20)


class TeamGroupSchema(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=500)
    sort_order: int = 0
    color: Optional[str] = Field(default=None, max_length=20)


class TeamStructureUpdate(BaseModel):
    groups: list[TeamGroupSchema] = Field(default_factory=list)
    roles: list[TeamRoleSchema] = Field(default_factory=list)


class CompanyBrandUpdate(BaseModel):
    company_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    brand_logo_url: Optional[str] = Field(default=None, max_length=500)
    brand_color: Optional[str] = Field(default=None, max_length=20)
    brand_tagline: Optional[str] = Field(default=None, max_length=500)
    brand_website: Optional[str] = Field(default=None, max_length=500)
    brand_phone: Optional[str] = Field(default=None, max_length=50)
    default_meeting_url: Optional[str] = Field(default=None, max_length=500)
    default_pdf_url: Optional[str] = Field(default=None, max_length=500)
    white_label_enabled: Optional[bool] = None
    hide_platform_branding: Optional[bool] = None
    brand_display_name: Optional[str] = Field(default=None, max_length=255)
    brand_favicon_url: Optional[str] = Field(default=None, max_length=500)
    brand_secondary_color: Optional[str] = Field(default=None, max_length=20)

    @field_validator(
        "brand_logo_url",
        "brand_website",
        "default_meeting_url",
        "default_pdf_url",
        "brand_favicon_url",
        mode="before",
    )
    @classmethod
    def validate_external_urls(cls, value: object) -> object:
        if value is None or isinstance(value, str) and not str(value).strip():
            return value
        if isinstance(value, str):
            return validate_safe_http_url(value)
        return value


class UserBase(BaseModel):
    name: str
    email: EmailStr
    company_id: Optional[int] = None
    role: UserRole = UserRole.COMPANY_USER


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    avatar_url: Optional[str] = None


class CampaignBase(BaseModel):
    company_id: int
    name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CampaignCreate(CampaignBase):
    pass


class CampaignCreateBody(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CampaignRead(CampaignBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ProductBase(BaseModel):
    campaign_id: int
    unique_code: str
    product_type: str
    qr_url: Optional[str] = None
    status: ProductStatus = ProductStatus.ACTIVE


class ProductCreate(ProductBase):
    pass


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
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
    landing_blocks: Optional[list[dict[str, Any]]] = None
    linkedin_url: Optional[str] = None
    whatsapp: Optional[str] = None
    team_role_id: Optional[str] = None
    assigned_user_id: Optional[int] = None
    event_tag: Optional[str] = None


class CompanyMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: UserRole
    avatar_url: Optional[str] = None


class CompanyMemberCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    role: UserRole = UserRole.COMPANY_USER
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)


class CompanyMemberCreateResponse(CompanyMemberRead):
    temporary_password: Optional[str] = None
    login_hint: Optional[str] = None


class LandingPageUpdate(BaseModel):
    landing_headline: Optional[str] = Field(default=None, max_length=255)
    landing_description: Optional[str] = Field(default=None, max_length=10000)
    logo_url: Optional[str] = Field(default=None, max_length=500)
    video_url: Optional[str] = Field(default=None, max_length=500)
    pdf_url: Optional[str] = Field(default=None, max_length=500)
    meeting_url: Optional[str] = Field(default=None, max_length=500)
    contact_form_enabled: Optional[bool] = None
    landing_template: Optional[str] = Field(default=None, max_length=50)
    primary_color: Optional[str] = Field(default=None, max_length=20)
    hero_image_url: Optional[str] = Field(default=None, max_length=2000)
    highlight_1: Optional[str] = Field(default=None, max_length=255)
    highlight_2: Optional[str] = Field(default=None, max_length=255)
    highlight_3: Optional[str] = Field(default=None, max_length=255)
    landing_blocks: Optional[list[dict[str, Any]]] = Field(default=None, max_length=50)
    linkedin_url: Optional[str] = Field(default=None, max_length=500)
    whatsapp: Optional[str] = Field(default=None, max_length=50)
    event_tag: Optional[str] = Field(default=None, max_length=100)

    @field_validator(
        "logo_url",
        "video_url",
        "pdf_url",
        "meeting_url",
        "hero_image_url",
        "linkedin_url",
        mode="before",
    )
    @classmethod
    def validate_landing_urls(cls, value: object) -> object:
        if value is None or isinstance(value, str) and not str(value).strip():
            return value
        if isinstance(value, str):
            return validate_safe_http_url(value)
        return value


class LeadSubmit(BaseModel):
    product_code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    company: Optional[str] = Field(default=None, max_length=255)
    event_tag: Optional[str] = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def require_email_or_phone(self) -> "LeadSubmit":
        if not self.email and not (self.phone and self.phone.strip()):
            raise ValueError("Email or phone is required")
        return self


class InteractionBase(BaseModel):
    product_id: int
    city: Optional[str] = None
    country: Optional[str] = None
    device_type: Optional[str] = None
    ip_address: Optional[str] = None
    event_tag: Optional[str] = None
    action: Optional[str] = None


class InteractionRead(InteractionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime


class LeadBase(BaseModel):
    product_id: int
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    event_tag: Optional[str] = None


class LeadCreate(LeadBase):
    pass


class LeadRead(LeadBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
