"""Product and Product Variant API endpoints."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.db.session import get_db
from app.models.user import User
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
from app.services.product_service import ProductService

router = APIRouter()


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new catalog product",
    description="Restricted to admin and staff users. Enforces unique product codes.",
)
async def create_product(
    payload: ProductCreateRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role(["admin", "staff"])),
) -> ProductResponse:
    """Create a new catalog product (admin/staff only)."""
    product = await ProductService.create_product(db, payload)
    return ProductResponse.model_validate(product)


@router.get(
    "",
    response_model=ProductListResponse,
    status_code=status.HTTP_200_OK,
    summary="List catalog products",
    description="Public or authenticated endpoint with pagination and status/search filters.",
)
async def list_products(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search term for name or code"),
    db: AsyncSession = Depends(get_db),
) -> ProductListResponse:
    """List catalog products with pagination and search."""
    items, total, pages = await ProductService.list_products(
        db, page=page, limit=limit, is_active=is_active, search=search
    )
    return ProductListResponse(
        items=[ProductResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get(
    "/{product_id}",
    response_model=ProductDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve product by ID",
    description="Returns detailed product information including active variants.",
)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ProductDetailResponse:
    """Retrieve product details and variants."""
    product = await ProductService.get_product_by_id(db, product_id, include_variants=True)
    return ProductDetailResponse.model_validate(product)


@router.patch(
    "/{product_id}",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Update product details",
    description="Restricted to admin and staff. Allows modifying name, code, description, and status.",
)
async def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role(["admin", "staff"])),
) -> ProductResponse:
    """Update a product (admin/staff only)."""
    product = await ProductService.update_product(db, product_id, payload)
    return ProductResponse.model_validate(product)


@router.post(
    "/{product_id}/activate",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Activate a product",
    description="Admin/staff endpoint to enable a product in the catalog.",
)
async def activate_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role(["admin", "staff"])),
) -> ProductResponse:
    """Activate a product (admin/staff only)."""
    product = await ProductService.set_product_status(db, product_id, is_active=True)
    return ProductResponse.model_validate(product)


@router.post(
    "/{product_id}/deactivate",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Deactivate a product",
    description="Admin/staff endpoint to disable a product in the catalog.",
)
async def deactivate_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role(["admin", "staff"])),
) -> ProductResponse:
    """Deactivate a product (admin/staff only)."""
    product = await ProductService.set_product_status(db, product_id, is_active=False)
    return ProductResponse.model_validate(product)


@router.post(
    "/{product_id}/variants",
    response_model=ProductVariantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a product variant",
    description="Admin/staff endpoint to create a distinct SKU variant under a product.",
)
async def create_variant(
    product_id: uuid.UUID,
    payload: ProductVariantCreateRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role(["admin", "staff"])),
) -> ProductVariantResponse:
    """Create a variant under a product (admin/staff only)."""
    variant = await ProductService.create_variant(db, product_id, payload)
    return ProductVariantResponse.model_validate(variant)


@router.get(
    "/{product_id}/variants",
    response_model=List[ProductVariantResponse],
    status_code=status.HTTP_200_OK,
    summary="List variants of a product",
    description="Returns all variants associated with a given product.",
)
async def list_variants(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> List[ProductVariantResponse]:
    """List variants for a product."""
    variants = await ProductService.list_variants(db, product_id)
    return [ProductVariantResponse.model_validate(v) for v in variants]


@router.patch(
    "/{product_id}/variants/{variant_id}",
    response_model=ProductVariantResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a product variant",
    description="Admin/staff endpoint to update variant name, SKU, price, or status.",
)
async def update_variant(
    product_id: uuid.UUID,
    variant_id: uuid.UUID,
    payload: ProductVariantUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role(["admin", "staff"])),
) -> ProductVariantResponse:
    """Update a product variant (admin/staff only)."""
    variant = await ProductService.update_variant(db, product_id, variant_id, payload)
    return ProductVariantResponse.model_validate(variant)

