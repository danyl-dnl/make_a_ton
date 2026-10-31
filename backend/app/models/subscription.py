"""Subscription and SubscriptionLine models."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.billing_event import BillingEvent
    from app.models.customer import Customer
    from app.models.invoice import Invoice
    from app.models.organization import Organization
    from app.models.plan import Plan
    from app.models.product import Product, ProductVariant


class Subscription(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Recurring subscription contract."""

    __tablename__ = "subscriptions"

    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("plans.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    subscription_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="active",
        index=True,
        nullable=False,
    )
    current_period_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    current_period_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    trial_start: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    trial_end: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    cancel_at_period_end: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    canceled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    customer: Mapped["Customer"] = relationship(
        back_populates="subscriptions",
    )
    plan: Mapped["Plan"] = relationship(
        back_populates="subscriptions",
    )
    organization: Mapped[Optional["Organization"]] = relationship(
        back_populates="subscriptions",
    )
    lines: Mapped[List["SubscriptionLine"]] = relationship(
        back_populates="subscription",
        cascade="all, delete-orphan",
    )
    invoices: Mapped[List["Invoice"]] = relationship(
        back_populates="subscription",
    )
    billing_events: Mapped[List["BillingEvent"]] = relationship(
        back_populates="subscription",
        cascade="all, delete-orphan",
    )


class SubscriptionLine(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Itemized service component within a recurring subscription."""

    __tablename__ = "subscription_lines"

    subscription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("subscriptions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
    )
    product_variant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="SET NULL"),
        nullable=True,
    )
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # Relationships
    subscription: Mapped["Subscription"] = relationship(
        back_populates="lines",
    )
    product: Mapped[Optional["Product"]] = relationship()
    variant: Mapped[Optional["ProductVariant"]] = relationship()
