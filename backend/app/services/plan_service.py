"""Plan and PlanProduct association business logic service."""

import math
import uuid
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.plan import Plan, PlanProduct
from app.models.product import Product, ProductVariant
from app.schemas.plan import (
    PlanCreateRequest,
    PlanProductAssociateRequest,
    PlanProductResponse,
    PlanProductUpdateRequest,
    PlanUpdateRequest,
)


class PlanService:
    """Service handling pricing plans and product associations."""

    @staticmethod
    async def create_plan(
        db: AsyncSession,
        payload: PlanCreateRequest,
    ) -> Plan:
        """Create a new pricing plan enforcing unique plan codes."""
        existing = await db.scalar(
            select(Plan).where(Plan.code == payload.code)
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Plan code '{payload.code}' is already registered.",
            )

        new_plan = Plan(
            name=payload.name,
            code=payload.code,
            description=payload.description,
            billing_interval=payload.billing_interval,
            billing_interval_count=payload.billing_interval_count,
            price=payload.price,
            currency=payload.currency,
            trial_period_days=payload.trial_period_days,
            is_active=payload.is_active,
            organization_id=payload.organization_id,
        )
        db.add(new_plan)
        await db.commit()
        await db.refresh(new_plan)
        return new_plan

    @staticmethod
    async def list_plans(
        db: AsyncSession,
        page: int = 1,
        limit: int = 20,
        is_active: Optional[bool] = None,
        billing_interval: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Plan], int, int]:
        """List pricing plans with pagination, interval filtering, and search."""
        query = select(Plan)
        count_query = select(func.count(Plan.id))

        if is_active is not None:
            query = query.where(Plan.is_active == is_active)
            count_query = count_query.where(Plan.is_active == is_active)

        if billing_interval:
            query = query.where(Plan.billing_interval == billing_interval.strip().lower())
            count_query = count_query.where(Plan.billing_interval == billing_interval.strip().lower())

        if search:
            search_term = f"%{search.strip()}%"
            filter_clause = or_(
                Plan.name.ilike(search_term),
                Plan.code.ilike(search_term),
                Plan.description.ilike(search_term),
            )
            query = query.where(filter_clause)
            count_query = count_query.where(filter_clause)

        total = await db.scalar(count_query) or 0
        pages = math.ceil(total / limit) if total > 0 else 1
        offset = (page - 1) * limit

        query = query.order_by(Plan.created_at.desc()).offset(offset).limit(limit)
        result = await db.scalars(query)
        items = list(result.all())

        return items, total, pages

    @staticmethod
    async def get_plan_by_id(
        db: AsyncSession,
        plan_id: uuid.UUID,
        include_products: bool = False,
    ) -> Plan:
        """Retrieve an individual plan by ID, optionally loading associated products/variants."""
        query = select(Plan).where(Plan.id == plan_id)
        if include_products:
            query = query.options(
                selectinload(Plan.plan_products).selectinload(PlanProduct.product),
                selectinload(Plan.plan_products).selectinload(PlanProduct.variant),
            )

        plan = await db.scalar(query)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Plan with ID '{plan_id}' was not found.",
            )
        return plan

    @staticmethod
    async def update_plan(
        db: AsyncSession,
        plan_id: uuid.UUID,
        payload: PlanUpdateRequest,
    ) -> Plan:
        """Update plan attributes and validate code uniqueness upon modification."""
        plan = await PlanService.get_plan_by_id(db, plan_id)

        if payload.code is not None and payload.code != plan.code:
            code_conflict = await db.scalar(
                select(Plan).where(
                    Plan.code == payload.code,
                    Plan.id != plan_id,
                )
            )
            if code_conflict:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Plan code '{payload.code}' is already registered to another plan.",
                )
            plan.code = payload.code

        if payload.name is not None:
            plan.name = payload.name
        if payload.description is not None:
            plan.description = payload.description
        if payload.billing_interval is not None:
            plan.billing_interval = payload.billing_interval
        if payload.billing_interval_count is not None:
            plan.billing_interval_count = payload.billing_interval_count
        if payload.price is not None:
            plan.price = payload.price
        if payload.currency is not None:
            plan.currency = payload.currency
        if payload.trial_period_days is not None:
            plan.trial_period_days = payload.trial_period_days
        if payload.is_active is not None:
            plan.is_active = payload.is_active

        await db.commit()
        await db.refresh(plan)
        return plan

    @staticmethod
    async def set_plan_status(
        db: AsyncSession,
        plan_id: uuid.UUID,
        is_active: bool,
    ) -> Plan:
        """Activate or deactivate a pricing plan."""
        plan = await PlanService.get_plan_by_id(db, plan_id)
        plan.is_active = is_active
        await db.commit()
        await db.refresh(plan)
        return plan

    @staticmethod
    async def associate_product(
        db: AsyncSession,
        plan_id: uuid.UUID,
        payload: PlanProductAssociateRequest,
    ) -> PlanProduct:
        """Associate a product and optional variant with a plan, validating foreign references."""
        # 1. Ensure plan exists
        await PlanService.get_plan_by_id(db, plan_id)

        # 2. Verify product exists
        product = await db.scalar(
            select(Product).where(Product.id == payload.product_id)
        )
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{payload.product_id}' was not found.",
            )

        # 3. If variant is specified, verify existence and relationship to product
        if payload.product_variant_id is not None:
            variant = await db.scalar(
                select(ProductVariant).where(
                    ProductVariant.id == payload.product_variant_id,
                    ProductVariant.product_id == payload.product_id,
                )
            )
            if not variant:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Variant '{payload.product_variant_id}' does not belong to product '{payload.product_id}'.",
                )

        # 4. Check for duplicate association
        existing = await db.scalar(
            select(PlanProduct).where(
                PlanProduct.plan_id == plan_id,
                PlanProduct.product_id == payload.product_id,
                PlanProduct.product_variant_id == payload.product_variant_id,
            )
        )
        if existing:
            # Update quantity instead of raising conflict
            existing.quantity = payload.quantity
            await db.commit()
            await db.refresh(existing)
            return existing

        assoc = PlanProduct(
            plan_id=plan_id,
            product_id=payload.product_id,
            product_variant_id=payload.product_variant_id,
            quantity=payload.quantity,
        )
        db.add(assoc)
        await db.commit()
        await db.refresh(assoc)
        return assoc

    @staticmethod
    async def update_association(
        db: AsyncSession,
        plan_id: uuid.UUID,
        association_id: uuid.UUID,
        payload: PlanProductUpdateRequest,
    ) -> PlanProduct:
        """Update an existing plan-product association."""
        assoc = await db.scalar(
            select(PlanProduct).where(
                PlanProduct.id == association_id,
                PlanProduct.plan_id == plan_id,
            )
        )
        if not assoc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Association '{association_id}' not found under plan '{plan_id}'.",
            )

        if payload.product_variant_id is not None:
            variant = await db.scalar(
                select(ProductVariant).where(
                    ProductVariant.id == payload.product_variant_id,
                    ProductVariant.product_id == assoc.product_id,
                )
            )
            if not variant:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Variant '{payload.product_variant_id}' does not belong to product '{assoc.product_id}'.",
                )
            assoc.product_variant_id = payload.product_variant_id

        if payload.quantity is not None:
            assoc.quantity = payload.quantity

        await db.commit()
        await db.refresh(assoc)
        return assoc

    @staticmethod
    async def remove_association(
        db: AsyncSession,
        plan_id: uuid.UUID,
        association_id: uuid.UUID,
    ) -> None:
        """Remove a product association from a plan."""
        assoc = await db.scalar(
            select(PlanProduct).where(
                PlanProduct.id == association_id,
                PlanProduct.plan_id == plan_id,
            )
        )
        if not assoc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Association '{association_id}' not found under plan '{plan_id}'.",
            )
        await db.delete(assoc)
        await db.commit()

    @staticmethod
    async def list_plan_products(
        db: AsyncSession,
        plan_id: uuid.UUID,
    ) -> List[PlanProductResponse]:
        """List all products and variants associated with a plan."""
        # Ensure plan exists
        await PlanService.get_plan_by_id(db, plan_id)

        result = await db.scalars(
            select(PlanProduct)
            .options(
                selectinload(PlanProduct.product),
                selectinload(PlanProduct.variant),
            )
            .where(PlanProduct.plan_id == plan_id)
            .order_by(PlanProduct.created_at.asc())
        )
        associations = list(result.all())

        response_items: List[PlanProductResponse] = []
        for a in associations:
            item = PlanProductResponse(
                id=a.id,
                plan_id=a.plan_id,
                product_id=a.product_id,
                product_variant_id=a.product_variant_id,
                quantity=a.quantity,
                created_at=a.created_at,
                updated_at=a.updated_at,
                product_name=a.product.name if a.product else None,
                product_code=a.product.code if a.product else None,
                variant_name=a.variant.name if a.variant else None,
                variant_sku=a.variant.sku if a.variant else None,
            )
            response_items.append(item)
        return response_items

