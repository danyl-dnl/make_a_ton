"""Billing event idempotency and tracking model."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.subscription import Subscription


class BillingEvent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Lifecycle billing event ensuring idempotency per subscription billing interval."""

    __tablename__ = "billing_events"
    __table_args__ = (
        UniqueConstraint(
            "subscription_id",
            "period_start",
            "period_end",
            "event_type",
            name="uq_billing_event_subscription_period_type",
        ),
    )

    subscription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("subscriptions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="processed", nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    subscription: Mapped["Subscription"] = relationship(
        back_populates="billing_events",
    )
