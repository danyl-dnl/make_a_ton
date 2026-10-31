"""Quotation Template and Template Line models."""

import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.plan import Plan
    from app.models.product import Product


class QuotationTemplate(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Reusable quotation preset template."""

    __tablename__ = "quotation_templates"

    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    default_validity_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    organization: Mapped[Optional["Organization"]] = relationship()
    lines: Mapped[List["QuotationTemplateLine"]] = relationship(
        back_populates="template",
        cascade="all, delete-orphan",
    )


class QuotationTemplateLine(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Individual line item preset within a quotation template."""

    __tablename__ = "quotation_template_lines"

    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("quotation_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
    )
    plan_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("plans.id", ondelete="SET NULL"),
        nullable=True,
    )
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # Relationships
    template: Mapped["QuotationTemplate"] = relationship(
        back_populates="lines",
    )
    product: Mapped[Optional["Product"]] = relationship()
    plan: Mapped[Optional["Plan"]] = relationship()
