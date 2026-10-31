"""Product and Product Variant business logic service."""

import math
import uuid
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product, ProductVariant
from app.schemas.product import (
    ProductCreateRequest,
    ProductUpdateRequest,
    ProductVariantCreateRequest,
    ProductVariantUpdateRequest,
)


class ProductService:
    """Service handling product catalog and variant management."""

    @staticmethod
    async def create_product(
        db: AsyncSession,
        payload: ProductCreateRequest,
    ) -> Product:
        """Create a new catalog product enforcing unique product codes."""
        existing = await db.scalar(
            select(Product).where(Product.code == payload.code)
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product code '{payload.code}' is already registered.",
            )

        new_product = Product(
            name=payload.name,
            code=payload.code,
            description=payload.description,
            is_active=payload.is_active,
            organization_id=payload.organization_id,
        )
        db.add(new_product)
        await db.commit()
        await db.refresh(new_product)
        return new_product

    @staticmethod
    async def list_products(
        db: AsyncSession,
        page: int = 1,
        limit: int = 20,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Product], int, int]:
        """List products with pagination, search, and active status filters."""
        query = select(Product)
        count_query = select(func.count(Product.id))

        if is_active is not None:
            query = query.where(Product.is_active == is_active)
            count_query = count_query.where(Product.is_active == is_active)

        if search:
            search_term = f"%{search.strip()}%"
            filter_clause = or_(
                Product.name.ilike(search_term),
                Product.code.ilike(search_term),
                Product.description.ilike(search_term),
            )
            query = query.where(filter_clause)
            count_query = count_query.where(filter_clause)

        total = await db.scalar(count_query) or 0
        pages = math.ceil(total / limit) if total > 0 else 1
        offset = (page - 1) * limit

        query = query.order_by(Product.created_at.desc()).offset(offset).limit(limit)
        result = await db.scalars(query)
        items = list(result.all())

        return items, total, pages

    @staticmethod
    async def get_product_by_id(
        db: AsyncSession,
        product_id: uuid.UUID,
        include_variants: bool = False,
    ) -> Product:
        """Retrieve an individual product by ID, optionally loading its variants."""
        query = select(Product).where(Product.id == product_id)
        if include_variants:
            query = query.options(selectinload(Product.variants))

        product = await db.scalar(query)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id}' was not found.",
            )
        return product

    @staticmethod
    async def update_product(
        db: AsyncSession,
        product_id: uuid.UUID,
        payload: ProductUpdateRequest,
    ) -> Product:
        """Update product attributes and validate code uniqueness upon modification."""
        product = await ProductService.get_product_by_id(db, product_id)

        if payload.code is not None and payload.code != product.code:
            code_conflict = await db.scalar(
                select(Product).where(
                    Product.code == payload.code,
                    Product.id != product_id,
                )
            )
            if code_conflict:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product code '{payload.code}' is already registered to another product.",
                )
            product.code = payload.code

        if payload.name is not None:
            product.name = payload.name
        if payload.description is not None:
            product.description = payload.description
        if payload.is_active is not None:
            product.is_active = payload.is_active

        await db.commit()
        await db.refresh(product)
        return product

    @staticmethod
    async def set_product_status(
        db: AsyncSession,
        product_id: uuid.UUID,
        is_active: bool,
    ) -> Product:
        """Activate or deactivate a product."""
        product = await ProductService.get_product_by_id(db, product_id)
        product.is_active = is_active
        await db.commit()
        await db.refresh(product)
        return product

    @staticmethod
    async def create_variant(
        db: AsyncSession,
        product_id: uuid.UUID,
        payload: ProductVariantCreateRequest,
    ) -> ProductVariant:
        """Create a new product variant enforcing unique SKU."""
        # Ensure parent product exists
        await ProductService.get_product_by_id(db, product_id)

        existing_sku = await db.scalar(
            select(ProductVariant).where(ProductVariant.sku == payload.sku)
        )
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Variant SKU '{payload.sku}' is already registered.",
            )

        variant = ProductVariant(
            product_id=product_id,
            name=payload.name,
            sku=payload.sku,
            price=payload.price,
            is_active=payload.is_active,
        )
        db.add(variant)
        await db.commit()
        await db.refresh(variant)
        return variant

    @staticmethod
    async def update_variant(
        db: AsyncSession,
        product_id: uuid.UUID,
        variant_id: uuid.UUID,
        payload: ProductVariantUpdateRequest,
    ) -> ProductVariant:
        """Update a product variant ensuring SKU uniqueness."""
        variant = await db.scalar(
            select(ProductVariant).where(
                ProductVariant.id == variant_id,
                ProductVariant.product_id == product_id,
            )
        )
        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Variant '{variant_id}' not found under product '{product_id}'.",
            )

        if payload.sku is not None and payload.sku != variant.sku:
            sku_conflict = await db.scalar(
                select(ProductVariant).where(
                    ProductVariant.sku == payload.sku,
                    ProductVariant.id != variant_id,
                )
            )
            if sku_conflict:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Variant SKU '{payload.sku}' is already registered to another variant.",
                )
            variant.sku = payload.sku

        if payload.name is not None:
            variant.name = payload.name
        if payload.price is not None:
            variant.price = payload.price
        if payload.is_active is not None:
            variant.is_active = payload.is_active

        await db.commit()
        await db.refresh(variant)
        return variant

    @staticmethod
    async def list_variants(
        db: AsyncSession,
        product_id: uuid.UUID,
    ) -> List[ProductVariant]:
        """List all variants belonging to a specific product."""
        # Ensure parent product exists
        await ProductService.get_product_by_id(db, product_id)

        result = await db.scalars(
            select(ProductVariant)
            .where(ProductVariant.product_id == product_id)
            .order_by(ProductVariant.created_at.asc())
        )
        return list(result.all())

