"""Pydantic schemas package."""

from app.schemas.auth import (
    StaffCreateRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.schemas.health import DatabaseHealth, HealthCheckResponse
from app.schemas.plan import (
    PlanCreateRequest,
    PlanDetailResponse,
    PlanListResponse,
    PlanProductAssociateRequest,
    PlanProductResponse,
    PlanProductUpdateRequest,
    PlanResponse,
    PlanUpdateRequest,
)
from app.schemas.product import (
    ProductCreateRequest,
    ProductDetailResponse,
    ProductListResponse,
    ProductResponse,
    ProductUpdateRequest,
    ProductVariantCreateRequest,
    ProductVariantResponse,
    ProductVariantUpdateRequest,
)

__all__ = [
    "DatabaseHealth",
    "HealthCheckResponse",
    "UserRegisterRequest",
    "StaffCreateRequest",
    "UserLoginRequest",
    "UserResponse",
    "TokenResponse",
    "ProductCreateRequest",
    "ProductUpdateRequest",
    "ProductResponse",
    "ProductDetailResponse",
    "ProductListResponse",
    "ProductVariantCreateRequest",
    "ProductVariantUpdateRequest",
    "ProductVariantResponse",
    "PlanCreateRequest",
    "PlanUpdateRequest",
    "PlanResponse",
    "PlanDetailResponse",
    "PlanListResponse",
    "PlanProductAssociateRequest",
    "PlanProductUpdateRequest",
    "PlanProductResponse",
]
