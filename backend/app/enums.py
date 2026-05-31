import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    COMPANY_USER = "company_user"


class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"


class ProductStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"
