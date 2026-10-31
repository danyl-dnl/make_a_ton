"""Plan and PlanProduct relationship models."""

import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.product import Product, ProductVariant
    from app.models.subscription import Subscription


class Plan(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Subscription pricing plan definition."""

    __tablename__ = "plans"

    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    billing_interval: Mapped[str] = mapped_column(String(50), nullable=False)
    billing_interval_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    trial_period_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    organization: Mapped[Optional["Organization"]] = relationship(
        back_populates="plans",
    )
    plan_products: Mapped[List["PlanProduct"]] = relationship(
        back_populates="plan",
        cascade="all, delete-orphan",
    )
    subscriptions: Mapped[List["Subscription"]] = relationship(
        back_populates="plan",
    )


class PlanProduct(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Many-to-many junction model linking Plans with catalog Products and Variants."""

    __tablename__ = "plan_products"
    __table_args__ = (
        UniqueConstraint(
            "plan_id",
            "product_id",
            "product_variant_id",
            name="uq_plan_product_variant",
        ),
    )

    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_variant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="SET NULL"),
        nullable=True,
    )
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    plan: Mapped["Plan"] = relationship(
        back_populates="plan_products",
    )
    product: Mapped["Product"] = relationship(
        back_populates="plan_products",
    )
    variant: Mapped[Optional["ProductVariant"]] = relationship()
