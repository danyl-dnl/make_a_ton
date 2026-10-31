"""Pydantic schemas for Plans and PlanProduct associations."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_BILLING_INTERVALS = ("daily", "weekly", "monthly", "quarterly", "semiannual", "annual", "yearly")


class PlanProductAssociateRequest(BaseModel):
    """Schema for associating a catalog product/variant with a plan."""

    product_id: uuid.UUID = Field(..., description="Target product ID")
    product_variant_id: Optional[uuid.UUID] = Field(None, description="Optional specific variant ID")
    quantity: int = Field(1, ge=1, description="Quantity included in plan")


class PlanProductUpdateRequest(BaseModel):
    """Schema for updating an existing plan-product association."""

    quantity: Optional[int] = Field(None, ge=1, description="Updated quantity")
    product_variant_id: Optional[uuid.UUID] = Field(None, description="Updated variant ID or null")


class PlanProductResponse(BaseModel):
    """Public representation of a plan-product association."""

    id: uuid.UUID
    plan_id: uuid.UUID
    product_id: uuid.UUID
    product_variant_id: Optional[uuid.UUID] = None
    quantity: int
    created_at: datetime
    updated_at: datetime

    # Denormalized nested metadata for clean presentation
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    variant_name: Optional[str] = None
    variant_sku: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PlanCreateRequest(BaseModel):
    """Schema for creating a subscription pricing plan."""

    name: str = Field(..., min_length=1, max_length=255, description="Plan display name")
    code: str = Field(..., min_length=1, max_length=100, description="Unique plan code")
    description: Optional[str] = Field(None, description="Plan description")
    billing_interval: str = Field("monthly", description="Billing frequency: monthly, annual, etc.")
    billing_interval_count: int = Field(1, ge=1, description="Interval multiplier")
    price: Decimal = Field(..., ge=0, description="Recurring periodic price in Decimal/Numeric")
    currency: str = Field("USD", min_length=3, max_length=3, description="ISO currency code")
    trial_period_days: int = Field(0, ge=0, description="Free trial period duration in days")
    is_active: bool = Field(True, description="Whether plan is available for subscriptions")
    organization_id: Optional[uuid.UUID] = Field(None, description="Associated organization ID")

    @field_validator("code", mode="before")
    @classmethod
    def normalize_code(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("billing_interval", mode="before")
    @classmethod
    def validate_interval(cls, v: str) -> str:
        if isinstance(v, str):
            norm = v.strip().lower()
            if norm not in VALID_BILLING_INTERVALS:
                raise ValueError(
                    f"Invalid billing_interval '{v}'. Allowed intervals: {', '.join(VALID_BILLING_INTERVALS)}."
                )
            return norm
        return v

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("price")
    @classmethod
    def validate_price_precision(cls, v: Decimal) -> Decimal:
        if v < Decimal("0.00"):
            raise ValueError("Price cannot be negative.")
        return round(v, 2)


class PlanUpdateRequest(BaseModel):
    """Schema for updating an existing pricing plan."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    billing_interval: Optional[str] = None
    billing_interval_count: Optional[int] = Field(None, ge=1)
    price: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    trial_period_days: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

    @field_validator("code", mode="before")
    @classmethod
    def normalize_code(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("billing_interval", mode="before")
    @classmethod
    def validate_interval(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            norm = v.strip().lower()
            if norm not in VALID_BILLING_INTERVALS:
                raise ValueError(
                    f"Invalid billing_interval '{v}'. Allowed intervals: {', '.join(VALID_BILLING_INTERVALS)}."
                )
            return norm
        return v

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("price")
    @classmethod
    def validate_price_precision(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None:
            if v < Decimal("0.00"):
                raise ValueError("Price cannot be negative.")
            return round(v, 2)
        return v


class PlanResponse(BaseModel):
    """Safe public representation of a pricing plan."""

    id: uuid.UUID
    organization_id: Optional[uuid.UUID] = None
    name: str
    code: str
    description: Optional[str] = None
    billing_interval: str
    billing_interval_count: int
    price: Decimal
    currency: str
    trial_period_days: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PlanDetailResponse(PlanResponse):
    """Detailed plan representation including associated products and variants."""

    plan_products: List[PlanProductResponse] = []


class PlanListResponse(BaseModel):
    """Paginated pricing plan list response."""

    items: List[PlanResponse]
    total: int
    page: int
    limit: int
    pages: int

