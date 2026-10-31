"""Tests for Product and Product Variant catalog management APIs."""

import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient


def unique_code(prefix: str = "PROD") -> str:
    """Generate unique product/sku identifier."""
    return f"{prefix}_{uuid.uuid4().hex[:8].upper()}"


def test_create_product_success(client: TestClient, admin_token: str):
    """Verify that an admin can create a new catalog product."""
    code = unique_code("SaaS")
    payload = {
        "name": "Cloud Storage Suite",
        "code": code,
        "description": "Secure enterprise cloud object storage",
        "is_active": True,
    }
    response = client.post(
        "/api/products",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201, f"Expected 201, got: {response.text}"
    data = response.json()
    assert data["name"] == "Cloud Storage Suite"
    assert data["code"] == code.upper()
    assert data["is_active"] is True
    assert "id" in data


def test_create_product_staff_success(client: TestClient, staff_token: str):
    """Verify that a staff user can also create a new catalog product."""
    code = unique_code("STAFF_PROD")
    response = client.post(
        "/api/products",
        json={"name": "Staff Managed Product", "code": code},
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert response.status_code == 201


def test_create_product_forbidden_for_customer(client: TestClient, customer_token: str):
    """Verify that customer users are strictly forbidden from creating products."""
    response = client.post(
        "/api/products",
        json={"name": "Hacker Product", "code": unique_code("FAIL")},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 403
    assert "insufficient permissions" in response.text.lower()


def test_create_product_unauthenticated(client: TestClient):
    """Verify that unauthenticated requests to create products return 401."""
    response = client.post(
        "/api/products",
        json={"name": "Unauth Product", "code": unique_code("UNAUTH")},
    )
    assert response.status_code == 401


def test_duplicate_product_code_rejected(client: TestClient, admin_token: str):
    """Verify that duplicate product code registration returns HTTP 400."""
    code = unique_code("DUP")
    client.post(
        "/api/products",
        json={"name": "Original Product", "code": code},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    duplicate_res = client.post(
        "/api/products",
        json={"name": "Second Product With Same Code", "code": code},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert duplicate_res.status_code == 400
    assert "already registered" in duplicate_res.text.lower()


def test_retrieve_product_by_id(client: TestClient, admin_token: str):
    """Verify retrieving a product by ID, including its variants."""
    code = unique_code("GET")
    create_res = client.post(
        "/api/products",
        json={"name": "Detail Product", "code": code, "description": "For retrieval"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = create_res.json()["id"]

    get_res = client.get(f"/api/products/{product_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == product_id
    assert data["name"] == "Detail Product"
    assert "variants" in data


def test_retrieve_nonexistent_product_returns_404(client: TestClient):
    """Verify that requesting an unknown product ID returns 404."""
    random_id = str(uuid.uuid4())
    response = client.get(f"/api/products/{random_id}")
    assert response.status_code == 404


def test_list_products_pagination_and_search(client: TestClient, admin_token: str):
    """Verify paginated listing and searching of products."""
    search_keyword = f"SEARCHKEY_{uuid.uuid4().hex[:6]}"
    client.post(
        "/api/products",
        json={"name": f"Module {search_keyword}", "code": unique_code("SRCH")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Search by keyword
    search_res = client.get(f"/api/products?search={search_keyword}")
    assert search_res.status_code == 200
    data = search_res.json()
    assert len(data["items"]) >= 1
    assert data["page"] == 1
    assert data["total"] >= 1


def test_update_product_details(client: TestClient, admin_token: str):
    """Verify updating product name, description, and code."""
    create_res = client.post(
        "/api/products",
        json={"name": "Initial Name", "code": unique_code("UPDT")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = create_res.json()["id"]

    new_code = unique_code("NEWCODE")
    update_res = client.patch(
        f"/api/products/{product_id}",
        json={
            "name": "Updated Name",
            "description": "Updated Description",
            "code": new_code,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["name"] == "Updated Name"
    assert data["code"] == new_code.upper()


def test_activate_and_deactivate_product(client: TestClient, admin_token: str):
    """Verify explicit activation and deactivation endpoints."""
    create_res = client.post(
        "/api/products",
        json={"name": "Toggle Product", "code": unique_code("TOGGLE"), "is_active": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = create_res.json()["id"]

    # Deactivate
    deact_res = client.post(
        f"/api/products/{product_id}/deactivate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert deact_res.status_code == 200
    assert deact_res.json()["is_active"] is False

    # Activate
    act_res = client.post(
        f"/api/products/{product_id}/activate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert act_res.status_code == 200
    assert act_res.json()["is_active"] is True


def test_create_and_list_product_variants(client: TestClient, admin_token: str):
    """Verify creating product variants with Decimal prices and listing them."""
    create_prod = client.post(
        "/api/products",
        json={"name": "Multi-Tier SaaS", "code": unique_code("TIER")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = create_prod.json()["id"]

    sku1 = unique_code("SKU1")
    var_res1 = client.post(
        f"/api/products/{product_id}/variants",
        json={"name": "Standard Tier", "sku": sku1, "price": "49.99"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert var_res1.status_code == 201
    assert Decimal(var_res1.json()["price"]) == Decimal("49.99")

    sku2 = unique_code("SKU2")
    var_res2 = client.post(
        f"/api/products/{product_id}/variants",
        json={"name": "Pro Tier", "sku": sku2, "price": "99.50"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert var_res2.status_code == 201

    # List variants
    list_res = client.get(f"/api/products/{product_id}/variants")
    assert list_res.status_code == 200
    variants = list_res.json()
    assert len(variants) == 2


def test_duplicate_variant_sku_rejected(client: TestClient, admin_token: str):
    """Verify that creating two variants with the same SKU is rejected."""
    prod_res = client.post(
        "/api/products",
        json={"name": "Parent Product", "code": unique_code("VAR_DUP")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = prod_res.json()["id"]
    sku = unique_code("SHARED_SKU")

    client.post(
        f"/api/products/{product_id}/variants",
        json={"name": "First Variant", "sku": sku, "price": "10.00"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    dup_res = client.post(
        f"/api/products/{product_id}/variants",
        json={"name": "Second Variant", "sku": sku, "price": "20.00"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert dup_res.status_code == 400
    assert "already registered" in dup_res.text.lower()


def test_negative_variant_price_rejected(client: TestClient, admin_token: str):
    """Verify that negative variant prices are rejected by Pydantic validation."""
    prod_res = client.post(
        "/api/products",
        json={"name": "Negative Price Parent", "code": unique_code("NEG")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = prod_res.json()["id"]

    response = client.post(
        f"/api/products/{product_id}/variants",
        json={"name": "Bad Price Variant", "sku": unique_code("SKU"), "price": "-15.00"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 422

