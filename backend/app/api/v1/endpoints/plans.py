"""Pricing Plan and Product Association API endpoints."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.db.session import get_db
from app.models.user import User
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
from app.services.plan_service import PlanService

router = APIRouter()


@router.post(
    "",
    response_model=PlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new pricing plan",
    description="Restricted to admin and staff. Enforces unique plan codes and Decimal pricing.",
)
async def create_plan(
    payload: PlanCreateRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role(["admin", "staff"])),
) -> PlanResponse:
    """Create a new pricing plan (admin/staff only)."""
    plan = await PlanService.create_plan(db, payload)
    return PlanResponse.model_validate(plan)


@router.get(
    "",
    response_model=PlanListResponse,
    status_code=status.HTTP_200_OK,
    summary="List available pricing plans",
    description="Public or authenticated endpoint with pagination, interval filtering, and search.",
)
async def list_plans(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    billing_interval: Optional[str] = Query(None, description="Filter by billing interval"),
    search: Optional[str] = Query(None, description="Search term for name or code"),
    db: AsyncSession = Depends(get_db),
) -> PlanListResponse:
    """List pricing plans with filters and pagination."""
    items, total, pages = await PlanService.list_plans(
        db,
        page=page,
        limit=limit,
        is_active=is_active,
        billing_interval=billing_interval,
        search=search,
    )
    return PlanListResponse(
        items=[PlanResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get(
    "/{plan_id}",
    response_model=PlanDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve pricing plan by ID",
    description="Returns plan details and associated catalog products/variants.",
)
async def get_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> PlanDetailResponse:
    """Retrieve plan details and associated products."""
    plan = await PlanService.get_plan_by_id(db, plan_id, include_products=True)
    plan_products_data = await PlanService.list_plan_products(db, plan_id)
    detail = PlanDetailResponse.model_validate(plan)
    detail.plan_products = plan_products_data
    return detail


@router.patch(
    "/{plan_id}",
    response_model=PlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Update pricing plan details",
    description="Admin/staff endpoint to modify plan name, price, interval, or status.",
)
async def update_plan(
    plan_id: uuid.UUID,
    payload: PlanUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role(["admin", "staff"])),
) -> PlanResponse:
    """Update a pricing plan (admin/staff only)."""
    plan = await PlanService.update_plan(db, plan_id, payload)
    return PlanResponse.model_validate(plan)


@router.post(
    "/{plan_id}/activate",
    response_model=PlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Activate a pricing plan",
    description="Admin/staff endpoint to enable a pricing plan.",
)
async def activate_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role(["admin", "staff"])),
) -> PlanResponse:
    """Activate a pricing plan (admin/staff only)."""
    plan = await PlanService.set_plan_status(db, plan_id, is_active=True)
    return PlanResponse.model_validate(plan)


@router.post(
    "/{plan_id}/deactivate",
    response_model=PlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Deactivate a pricing plan",
    description="Admin/staff endpoint to disable a pricing plan.",
)
async def deactivate_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role(["admin", "staff"])),
) -> PlanResponse:
    """Deactivate a pricing plan (admin/staff only)."""
    plan = await PlanService.set_plan_status(db, plan_id, is_active=False)
    return PlanResponse.model_validate(plan)


@router.post(
    "/{plan_id}/products",
    response_model=PlanProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Associate product/variant with plan",
    description="Admin/staff endpoint to attach a catalog product or variant to a plan.",
)
async def associate_product(
    plan_id: uuid.UUID,
    payload: PlanProductAssociateRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role(["admin", "staff"])),
) -> PlanProductResponse:
    """Associate a product/variant with a plan (admin/staff only)."""
    assoc = await PlanService.associate_product(db, plan_id, payload)
    items = await PlanService.list_plan_products(db, plan_id)
    for it in items:
        if it.id == assoc.id:
            return it
    return PlanProductResponse.model_validate(assoc)


@router.get(
    "/{plan_id}/products",
    response_model=List[PlanProductResponse],
    status_code=status.HTTP_200_OK,
    summary="List products associated with a plan",
    description="Returns all product and variant items bundled within the plan.",
)
async def list_plan_products(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> List[PlanProductResponse]:
    """List products associated with a plan."""
    return await PlanService.list_plan_products(db, plan_id)


@router.patch(
    "/{plan_id}/products/{association_id}",
    response_model=PlanProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Update plan-product association",
    description="Admin/staff endpoint to modify quantity or variant within a plan bundle.",
)
async def update_plan_product(
    plan_id: uuid.UUID,
    association_id: uuid.UUID,
    payload: PlanProductUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role(["admin", "staff"])),
) -> PlanProductResponse:
    """Update association between plan and product (admin/staff only)."""
    await PlanService.update_association(db, plan_id, association_id, payload)
    items = await PlanService.list_plan_products(db, plan_id)
    for it in items:
        if it.id == association_id:
            return it
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Association not found.")


@router.delete(
    "/{plan_id}/products/{association_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove product association from plan",
    description="Admin/staff endpoint to detach a product or variant from a plan bundle.",
)
async def remove_plan_product(
    plan_id: uuid.UUID,
    association_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role(["admin", "staff"])),
) -> None:
    """Detach product from plan (admin/staff only)."""
    await PlanService.remove_association(db, plan_id, association_id)
