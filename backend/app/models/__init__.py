"""Database models package.

All domain models are exported here to ensure complete discovery by Alembic migrations.
"""

from app.db.base import Base
from app.models.audit_log import AuditLog
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.billing_event import BillingEvent
from app.models.customer import Customer
from app.models.invoice import Invoice, InvoiceLine
from app.models.organization import Organization
from app.models.password_reset import PasswordResetToken
from app.models.payment import Payment
from app.models.plan import Plan, PlanProduct
from app.models.product import Product, ProductVariant
from app.models.quotation import Quotation, QuotationLine
from app.models.quotation_template import QuotationTemplate, QuotationTemplateLine
from app.models.subscription import Subscription, SubscriptionLine
from app.models.tax_discount import DiscountRule, TaxRule
from app.models.user import User

__all__ = [
    "Base",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
    "Organization",
    "User",
    "Customer",
    "Product",
    "ProductVariant",
    "Plan",
    "PlanProduct",
    "TaxRule",
    "DiscountRule",
    "QuotationTemplate",
    "QuotationTemplateLine",
    "Quotation",
    "QuotationLine",
    "Subscription",
    "SubscriptionLine",
    "Invoice",
    "InvoiceLine",
    "Payment",
    "BillingEvent",
    "PasswordResetToken",
    "AuditLog",
]
