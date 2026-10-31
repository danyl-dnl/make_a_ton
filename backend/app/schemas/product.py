"""Pydantic schemas for Products and Product Variants."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductVariantCreateRequest(BaseModel):
    """Schema for creating a product variant."""

    name: str = Field(..., min_length=1, max_length=255, description="Variant name")
    sku: str = Field(..., min_length=1, max_length=100, description="Unique variant SKU")
    price: Decimal = Field(..., ge=0, description="Variant unit price in Decimal/Numeric")
    is_active: bool = Field(True, description="Whether variant is active")

    @field_validator("sku", mode="before")
    @classmethod
    def normalize_sku(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("price")
    @classmethod
    def validate_price_precision(cls, v: Decimal) -> Decimal:
        if v < Decimal("0.00"):
            raise ValueError("Price cannot be negative.")
        return round(v, 2)


class ProductVariantUpdateRequest(BaseModel):
    """Schema for updating a product variant."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None

    @field_validator("sku", mode="before")
    @classmethod
    def normalize_sku(cls, v: Optional[str]) -> Optional[str]:
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


class ProductVariantResponse(BaseModel):
    """Safe public representation of a product variant."""

    id: uuid.UUID
    product_id: uuid.UUID
    name: str
    sku: str
    price: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductCreateRequest(BaseModel):
    """Schema for creating a catalog product."""

    name: str = Field(..., min_length=1, max_length=255, description="Product catalog name")
    code: str = Field(..., min_length=1, max_length=100, description="Unique product code")
    description: Optional[str] = Field(None, description="Detailed product description")
    is_active: bool = Field(True, description="Whether product is active")
    organization_id: Optional[uuid.UUID] = Field(None, description="Associated organization ID")

    @field_validator("code", mode="before")
    @classmethod
    def normalize_code(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().upper()
        return v


class ProductUpdateRequest(BaseModel):
    """Schema for updating a catalog product."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("code", mode="before")
    @classmethod
    def normalize_code(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            return v.strip().upper()
        return v


class ProductResponse(BaseModel):
    """Safe public representation of a product."""

    id: uuid.UUID
    organization_id: Optional[uuid.UUID] = None
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductDetailResponse(ProductResponse):
    """Detailed product representation including its variants."""

    variants: List[ProductVariantResponse] = []


class ProductListResponse(BaseModel):
    """Paginated product list response."""

    items: List[ProductResponse]
    total: int
    page: int
    limit: int
    pages: int

