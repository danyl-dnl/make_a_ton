"""Tests for relational database models, constraints, and historical financial snapshots."""

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import hash_password
from app.models.audit_log import AuditLog
from app.models.billing_event import BillingEvent
from app.models.customer import Customer
from app.models.invoice import Invoice, InvoiceLine
from app.models.organization import Organization
from app.models.payment import Payment
from app.models.plan import Plan, PlanProduct
from app.models.product import Product, ProductVariant
from app.models.quotation import Quotation, QuotationLine
from app.models.quotation_template import QuotationTemplate, QuotationTemplateLine
from app.models.subscription import Subscription, SubscriptionLine
from app.models.tax_discount import DiscountRule, TaxRule
from app.models.user import User


def unique_code(prefix: str = "CODE") -> str:
    """Generate isolated unique code/identifier."""
    return f"{prefix}_{uuid.uuid4().hex[:8].upper()}"


@pytest.mark.asyncio
async def test_organization_and_user_creation_and_relationship(db_session: AsyncSession):
    """Verify Organization tenant creation and user association."""
    org = Organization(
        name="Acme Global Corporation",
        slug=unique_code("acme").lower(),
        billing_email="billing@acme-global.test",
        currency="USD",
        timezone="America/New_York",
        is_active=True,
    )
    db_session.add(org)
    await db_session.flush()

    user = User(
        organization_id=org.id,
        email=f"admin_{uuid.uuid4().hex[:8]}@acme-global.test",
        hashed_password=hash_password("AdminSecure123!"),
        full_name="Acme Admin",
        role="admin",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(org)
    await db_session.refresh(user)

    assert user.id is not None
    assert user.organization_id == org.id
    assert user.created_at is not None
    assert user.updated_at is not None


@pytest.mark.asyncio
async def test_unique_user_email_constraint(db_session: AsyncSession):
    """Verify that PostgreSQL rejects inserting two users with identical email addresses."""
    dup_email = f"unique_test_{uuid.uuid4().hex[:8]}@brightloop-test.io"
    user1 = User(
        email=dup_email,
        hashed_password=hash_password("PasswordOne123!"),
        full_name="User One",
        role="customer",
        is_active=True,
    )
    db_session.add(user1)
    await db_session.commit()

    user2 = User(
        email=dup_email,
        hashed_password=hash_password("PasswordTwo123!"),
        full_name="User Two",
        role="customer",
        is_active=True,
    )
    db_session.add(user2)

    with pytest.raises(IntegrityError):
        await db_session.commit()

    await db_session.rollback()


@pytest.mark.asyncio
async def test_product_variants_and_plans_catalog(db_session: AsyncSession):
    """Verify Product, Variant, Plan, and PlanProduct many-to-many relationship."""
    product = Product(
        name="Cloud Compute Tier",
        code=unique_code("PROD"),
        description="Scalable cloud compute nodes",
        is_active=True,
    )
    db_session.add(product)
    await db_session.flush()

    variant = ProductVariant(
        product_id=product.id,
        name="16 vCPU / 64GB RAM",
        sku=unique_code("SKU"),
        price=Decimal("199.99"),
        is_active=True,
    )
    db_session.add(variant)
    await db_session.flush()

    plan = Plan(
        name="Enterprise Compute Annual",
        code=unique_code("PLAN"),
        billing_interval="annual",
        billing_interval_count=1,
        price=Decimal("1999.00"),
        currency="USD",
        trial_period_days=14,
        is_active=True,
    )
    db_session.add(plan)
    await db_session.flush()

    plan_product = PlanProduct(
        plan_id=plan.id,
        product_id=product.id,
        product_variant_id=variant.id,
        quantity=2,
    )
    db_session.add(plan_product)
    await db_session.commit()

    # Query back to verify relationships with selectinload
    reloaded_plan = await db_session.scalar(
        select(Plan).options(selectinload(Plan.plan_products)).where(Plan.id == plan.id)
    )
    assert reloaded_plan is not None
    assert len(reloaded_plan.plan_products) == 1
    assert reloaded_plan.plan_products[0].product_id == product.id
    assert reloaded_plan.price == Decimal("1999.00")


@pytest.mark.asyncio
async def test_customer_and_unique_subscription_numbers(db_session: AsyncSession):
    """Verify Subscription creation and unique subscription_number constraint."""
    customer = Customer(
        name="Subscriber Corp",
        email=f"sub_{uuid.uuid4().hex[:8]}@subscriber.test",
        currency="USD",
        is_active=True,
    )
    plan = Plan(
        name="Standard Monthly",
        code=unique_code("PLAN"),
        billing_interval="monthly",
        billing_interval_count=1,
        price=Decimal("49.00"),
        currency="USD",
        is_active=True,
    )
    db_session.add_all([customer, plan])
    await db_session.flush()

    now_utc = datetime.now(timezone.utc)
    sub_num = unique_code("SUB")

    sub1 = Subscription(
        customer_id=customer.id,
        plan_id=plan.id,
        subscription_number=sub_num,
        status="active",
        current_period_start=now_utc,
        current_period_end=now_utc + timedelta(days=30),
    )
    db_session.add(sub1)
    await db_session.commit()

    # Attempt to insert another subscription with identical subscription_number
    sub2 = Subscription(
        customer_id=customer.id,
        plan_id=plan.id,
        subscription_number=sub_num,
        status="active",
        current_period_start=now_utc,
        current_period_end=now_utc + timedelta(days=30),
    )
    db_session.add(sub2)

    with pytest.raises(IntegrityError):
        await db_session.commit()

    await db_session.rollback()


@pytest.mark.asyncio
async def test_unique_invoice_numbers(db_session: AsyncSession):
    """Verify unique invoice_number constraint on invoices table."""
    customer = Customer(
        name="Invoice Test Client",
        email=f"invoice_{uuid.uuid4().hex[:8]}@client.test",
        currency="USD",
        is_active=True,
    )
    db_session.add(customer)
    await db_session.flush()

    inv_num = unique_code("INV")
    due_dt = datetime.now(timezone.utc) + timedelta(days=14)

    inv1 = Invoice(
        customer_id=customer.id,
        invoice_number=inv_num,
        status="open",
        due_date=due_dt,
        currency="USD",
        subtotal=Decimal("100.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("10.00"),
        total=Decimal("110.00"),
    )
    db_session.add(inv1)
    await db_session.commit()

    inv2 = Invoice(
        customer_id=customer.id,
        invoice_number=inv_num,  # Duplicate
        status="open",
        due_date=due_dt,
        currency="USD",
        subtotal=Decimal("200.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("20.00"),
        total=Decimal("220.00"),
    )
    db_session.add(inv2)

    with pytest.raises(IntegrityError):
        await db_session.commit()

    await db_session.rollback()


@pytest.mark.asyncio
async def test_invoice_historical_line_snapshot_resilience(db_session: AsyncSession):
    """Verify that invoice lines preserve immutable historical unit prices even if catalog prices change."""
    customer = Customer(
        name="Historical Price Client",
        email=f"hist_{uuid.uuid4().hex[:8]}@history.test",
        currency="USD",
        is_active=True,
    )
    product = Product(
        name="Legacy SaaS Module",
        code=unique_code("PROD"),
        is_active=True,
    )
    db_session.add_all([customer, product])
    await db_session.flush()

    variant = ProductVariant(
        product_id=product.id,
        name="Initial Variant",
        sku=unique_code("SKU"),
        price=Decimal("50.00"),  # Initial price: 50.00
        is_active=True,
    )
    db_session.add(variant)
    await db_session.flush()

    # Generate invoice with line snapshot capturing unit_price=50.00
    inv = Invoice(
        customer_id=customer.id,
        invoice_number=unique_code("INV"),
        status="paid",
        due_date=datetime.now(timezone.utc),
        currency="USD",
        subtotal=Decimal("100.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("10.00"),
        total=Decimal("110.00"),
    )
    db_session.add(inv)
    await db_session.flush()

    line = InvoiceLine(
        invoice_id=inv.id,
        description="Legacy SaaS Module - 2 seats",
        quantity=2,
        unit_price=Decimal("50.00"),  # Preserved unit price
        discount_amount=Decimal("0.00"),
        tax_rate=Decimal("10.00"),
        tax_amount=Decimal("10.00"),
        total=Decimal("110.00"),
    )
    db_session.add(line)
    await db_session.commit()

    # Now simulate a product price increase in the catalog to 120.00
    variant.price = Decimal("120.00")
    await db_session.commit()

    # Verify that the historical invoice line remains strictly 50.00
    reloaded_line = await db_session.scalar(
        select(InvoiceLine).where(InvoiceLine.id == line.id)
    )
    assert reloaded_line is not None
    assert reloaded_line.unit_price == Decimal("50.00")
    assert reloaded_line.total == Decimal("110.00")


@pytest.mark.asyncio
async def test_billing_event_uniqueness_constraint(db_session: AsyncSession):
    """Verify that duplicate billing events for the same subscription and period are prevented."""
    customer = Customer(
        name="Billing Event Corp",
        email=f"event_{uuid.uuid4().hex[:8]}@billing.test",
        currency="USD",
        is_active=True,
    )
    plan = Plan(
        name="Event Plan",
        code=unique_code("PLAN"),
        billing_interval="monthly",
        price=Decimal("29.00"),
        currency="USD",
        is_active=True,
    )
    db_session.add_all([customer, plan])
    await db_session.flush()

    now_utc = datetime.now(timezone.utc)
    sub = Subscription(
        customer_id=customer.id,
        plan_id=plan.id,
        subscription_number=unique_code("SUB"),
        status="active",
        current_period_start=now_utc,
        current_period_end=now_utc + timedelta(days=30),
    )
    db_session.add(sub)
    await db_session.flush()

    period_start = now_utc
    period_end = now_utc + timedelta(days=30)

    event1 = BillingEvent(
        subscription_id=sub.id,
        event_type="invoice_generation",
        period_start=period_start,
        period_end=period_end,
        status="processed",
    )
    db_session.add(event1)
    await db_session.commit()

    # Attempt to insert identical billing event for the same subscription and period
    event2 = BillingEvent(
        subscription_id=sub.id,
        event_type="invoice_generation",
        period_start=period_start,
        period_end=period_end,
        status="processed",
    )
    db_session.add(event2)

    with pytest.raises(IntegrityError):
        await db_session.commit()

    await db_session.rollback()


@pytest.mark.asyncio
async def test_quotations_and_templates_creation(db_session: AsyncSession):
    """Verify QuotationTemplate and Quotation with itemized lines."""
    template = QuotationTemplate(
        name="Enterprise Onboarding Preset",
        description="Standard enterprise package preset",
        currency="USD",
        default_validity_days=45,
        is_active=True,
    )
    db_session.add(template)
    await db_session.flush()

    tpl_line = QuotationTemplateLine(
        template_id=template.id,
        description="Initial Setup and Migration",
        quantity=1,
        unit_price=Decimal("500.00"),
    )
    db_session.add(tpl_line)
    await db_session.flush()

    customer = Customer(
        name="Quotation Prospect Inc",
        email=f"quote_{uuid.uuid4().hex[:8]}@prospect.test",
        currency="USD",
        is_active=True,
    )
    db_session.add(customer)
    await db_session.flush()

    quotation = Quotation(
        customer_id=customer.id,
        quote_number=unique_code("QUO"),
        status="draft",
        valid_until=datetime.now(timezone.utc) + timedelta(days=45),
        subtotal=Decimal("500.00"),
        discount_amount=Decimal("50.00"),
        tax_amount=Decimal("45.00"),
        total=Decimal("495.00"),
        currency="USD",
    )
    db_session.add(quotation)
    await db_session.flush()

    quo_line = QuotationLine(
        quotation_id=quotation.id,
        description="Initial Setup and Migration",
        quantity=1,
        unit_price=Decimal("500.00"),
        discount_amount=Decimal("50.00"),
        tax_amount=Decimal("45.00"),
        total=Decimal("495.00"),
    )
    db_session.add(quo_line)
    await db_session.commit()

    assert quotation.id is not None
    assert quo_line.id is not None
    assert template.id is not None


@pytest.mark.asyncio
async def test_payment_and_audit_log_creation(db_session: AsyncSession):
    """Verify Payment ledger and AuditLog recording."""
    customer = Customer(
        name="Payment Corp",
        email=f"pay_{uuid.uuid4().hex[:8]}@payment.test",
        currency="USD",
        is_active=True,
    )
    db_session.add(customer)
    await db_session.flush()

    inv = Invoice(
        customer_id=customer.id,
        invoice_number=unique_code("INV"),
        status="open",
        due_date=datetime.now(timezone.utc) + timedelta(days=7),
        currency="USD",
        subtotal=Decimal("300.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("0.00"),
        total=Decimal("300.00"),
    )
    db_session.add(inv)
    await db_session.flush()

    payment = Payment(
        invoice_id=inv.id,
        payment_method="credit_card",
        transaction_reference=unique_code("TXN"),
        amount=Decimal("300.00"),
        currency="USD",
        status="succeeded",
        processed_at=datetime.now(timezone.utc),
    )
    db_session.add(payment)

    audit = AuditLog(
        action="payment_processed",
        entity_type="payment",
        entity_id=payment.id,
        changes='{"amount": 300.00, "status": "succeeded"}',
        ip_address="127.0.0.1",
    )
    db_session.add(audit)
    await db_session.commit()

    assert payment.id is not None
    assert audit.id is not None
    assert payment.amount == Decimal("300.00")
