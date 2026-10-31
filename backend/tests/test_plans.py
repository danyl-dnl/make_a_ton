"""Tests for Pricing Plan and Plan-Product bundle management APIs."""

import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient


def unique_code(prefix: str = "PLAN") -> str:
    """Generate unique plan/code identifier."""
    return f"{prefix}_{uuid.uuid4().hex[:8].upper()}"


def test_create_plan_success(client: TestClient, admin_token: str):
    """Verify admin can create a new pricing plan with Decimal price and valid billing interval."""
    code = unique_code("ENTERPRISE")
    payload = {
        "name": "Enterprise Annual Subscription",
        "code": code,
        "description": "Full access enterprise plan with annual invoicing",
        "billing_interval": "annual",
        "billing_interval_count": 1,
        "price": "1200.50",
        "currency": "USD",
        "trial_period_days": 14,
        "is_active": True,
    }
    response = client.post(
        "/api/plans",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201, f"Expected 201, got: {response.text}"
    data = response.json()
    assert data["name"] == "Enterprise Annual Subscription"
    assert data["code"] == code.upper()
    assert Decimal(data["price"]) == Decimal("1200.50")
    assert data["billing_interval"] == "annual"
    assert data["trial_period_days"] == 14
    assert data["is_active"] is True
    assert "id" in data


def test_create_plan_staff_success(client: TestClient, staff_token: str):
    """Verify staff member can create a pricing plan."""
    code = unique_code("STAFF_PLAN")
    response = client.post(
        "/api/plans",
        json={
            "name": "Staff Starter Plan",
            "code": code,
            "billing_interval": "monthly",
            "price": "29.99",
        },
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert response.status_code == 201


def test_create_plan_forbidden_for_customer(client: TestClient, customer_token: str):
    """Verify customer users receive HTTP 403 when attempting to create plans."""
    response = client.post(
        "/api/plans",
        json={
            "name": "Customer Created Plan",
            "code": unique_code("FORBIDDEN"),
            "price": "1.00",
        },
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 403
    assert "insufficient permissions" in response.text.lower()


def test_create_plan_unauthenticated(client: TestClient):
    """Verify unauthenticated requests to create plans receive HTTP 401."""
    response = client.post(
        "/api/plans",
        json={"name": "Unauth Plan", "code": unique_code("UNAUTH"), "price": "10.00"},
    )
    assert response.status_code == 401


def test_duplicate_plan_code_rejected(client: TestClient, admin_token: str):
    """Verify that registering duplicate plan codes returns HTTP 400."""
    code = unique_code("DUP_PLAN")
    client.post(
        "/api/plans",
        json={"name": "Original Plan", "code": code, "price": "10.00"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    dup_res = client.post(
        "/api/plans",
        json={"name": "Duplicate Plan", "code": code, "price": "20.00"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert dup_res.status_code == 400
    assert "already registered" in dup_res.text.lower()


def test_invalid_billing_interval_rejected(client: TestClient, admin_token: str):
    """Verify that unsupported billing intervals are rejected with HTTP 422."""
    response = client.post(
        "/api/plans",
        json={
            "name": "Bad Interval Plan",
            "code": unique_code("BADINT"),
            "billing_interval": "biweekly_unsupported",
            "price": "50.00",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 422


def test_negative_plan_price_rejected(client: TestClient, admin_token: str):
    """Verify that negative pricing is rejected with HTTP 422."""
    response = client.post(
        "/api/plans",
        json={
            "name": "Negative Plan",
            "code": unique_code("NEG"),
            "price": "-50.00",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 422


def test_retrieve_plan_by_id(client: TestClient, admin_token: str):
    """Verify retrieving a plan by ID, including its bundled products/variants."""
    code = unique_code("GET_PLAN")
    create_res = client.post(
        "/api/plans",
        json={"name": "Lookup Plan", "code": code, "price": "89.00"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    plan_id = create_res.json()["id"]

    get_res = client.get(f"/api/plans/{plan_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == plan_id
    assert data["name"] == "Lookup Plan"
    assert "plan_products" in data


def test_retrieve_nonexistent_plan_returns_404(client: TestClient):
    """Verify requesting an unknown plan returns 404."""
    random_id = str(uuid.uuid4())
    response = client.get(f"/api/plans/{random_id}")
    assert response.status_code == 404


def test_update_plan_details(client: TestClient, admin_token: str):
    """Verify updating plan price, interval, and code."""
    create_res = client.post(
        "/api/plans",
        json={"name": "Initial Plan", "code": unique_code("PLN_UPDT"), "price": "100.00"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    plan_id = create_res.json()["id"]

    update_res = client.patch(
        f"/api/plans/{plan_id}",
        json={
            "name": "Refreshed Plan Name",
            "price": "150.75",
            "billing_interval": "quarterly",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["name"] == "Refreshed Plan Name"
    assert Decimal(data["price"]) == Decimal("150.75")
    assert data["billing_interval"] == "quarterly"


def test_activate_and_deactivate_plan(client: TestClient, admin_token: str):
    """Verify explicit activation and deactivation endpoints for plans."""
    create_res = client.post(
        "/api/plans",
        json={"name": "Status Plan", "code": unique_code("PLN_ST"), "price": "10.00"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    plan_id = create_res.json()["id"]

    # Deactivate
    deact_res = client.post(
        f"/api/plans/{plan_id}/deactivate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert deact_res.status_code == 200
    assert deact_res.json()["is_active"] is False

    # Activate
    act_res = client.post(
        f"/api/plans/{plan_id}/activate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert act_res.status_code == 200
    assert act_res.json()["is_active"] is True


def test_plan_product_associations_lifecycle(client: TestClient, admin_token: str):
    """Verify associating products and variants with plans, updating, and removing associations."""
    # 1. Create a Product and a Variant
    prod_res = client.post(
        "/api/products",
        json={"name": "Bundle Product", "code": unique_code("BNDL")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = prod_res.json()["id"]

    var_res = client.post(
        f"/api/products/{product_id}/variants",
        json={"name": "Gold Variant", "sku": unique_code("GOLD"), "price": "50.00"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    variant_id = var_res.json()["id"]

    # 2. Create a Plan
    plan_res = client.post(
        "/api/plans",
        json={"name": "Bundle Plan", "code": unique_code("BNDL_PLN"), "price": "99.00"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    plan_id = plan_res.json()["id"]

    # 3. Associate Product and Variant with Plan
    assoc_res = client.post(
        f"/api/plans/{plan_id}/products",
        json={
            "product_id": product_id,
            "product_variant_id": variant_id,
            "quantity": 3,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert assoc_res.status_code == 201
    assoc_data = assoc_res.json()
    assert assoc_data["product_id"] == product_id
    assert assoc_data["product_variant_id"] == variant_id
    assert assoc_data["quantity"] == 3
    association_id = assoc_data["id"]

    # 4. List Plan Products
    list_assoc_res = client.get(f"/api/plans/{plan_id}/products")
    assert list_assoc_res.status_code == 200
    items = list_assoc_res.json()
    assert len(items) == 1
    assert items[0]["quantity"] == 3

    # 5. Update Association Quantity
    update_assoc_res = client.patch(
        f"/api/plans/{plan_id}/products/{association_id}",
        json={"quantity": 5},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert update_assoc_res.status_code == 200
    assert update_assoc_res.json()["quantity"] == 5

    # 6. Remove Association
    delete_res = client.delete(
        f"/api/plans/{plan_id}/products/{association_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert delete_res.status_code == 204

    # Verify association is removed
    recheck_res = client.get(f"/api/plans/{plan_id}/products")
    assert len(recheck_res.json()) == 0


def test_associate_invalid_product_reference_rejected(client: TestClient, admin_token: str):
    """Verify that associating a non-existent product ID returns HTTP 404."""
    plan_res = client.post(
        "/api/plans",
        json={"name": "Inv Prod Plan", "code": unique_code("INV_P"), "price": "10.00"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    plan_id = plan_res.json()["id"]

    random_prod_id = str(uuid.uuid4())
    res = client.post(
        f"/api/plans/{plan_id}/products",
        json={"product_id": random_prod_id, "quantity": 1},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 404
    assert "not found" in res.text.lower()


def test_associate_invalid_variant_reference_rejected(client: TestClient, admin_token: str):
    """Verify that referencing a variant that does not belong to the target product returns HTTP 400."""
    # Product 1
    p1_res = client.post(
        "/api/products",
        json={"name": "Product One", "code": unique_code("P1")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    p1_id = p1_res.json()["id"]

    # Product 2 with variant
    p2_res = client.post(
        "/api/products",
        json={"name": "Product Two", "code": unique_code("P2")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    p2_id = p2_res.json()["id"]
    var_res = client.post(
        f"/api/products/{p2_id}/variants",
        json={"name": "P2 Variant", "sku": unique_code("P2SKU"), "price": "10.00"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    p2_var_id = var_res.json()["id"]

    # Plan
    plan_res = client.post(
        "/api/plans",
        json={"name": "Mismatch Plan", "code": unique_code("MISMATCH"), "price": "20.00"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    plan_id = plan_res.json()["id"]

    # Attempt to associate Product 1 with Product 2's variant
    mismatch_res = client.post(
        f"/api/plans/{plan_id}/products",
        json={
            "product_id": p1_id,
            "product_variant_id": p2_var_id,
            "quantity": 1,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert mismatch_res.status_code == 400
    assert "does not belong to product" in mismatch_res.text.lower()

