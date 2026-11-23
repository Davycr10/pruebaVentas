import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def login(username: str, password: str) -> dict:
    response = client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


def make_product(admin_headers: dict, name="Producto", price=10.0, stock=5, category="general") -> dict:
    suffix = uuid.uuid4().hex[:6]
    response = client.post(
        "/api/products",
        headers=admin_headers,
        json={
            "name": f"{name}-{suffix}",
            "description": "producto de prueba",
            "price": price,
            "stock": stock,
            "category": category,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def clear_cart(headers: dict) -> None:
    items = client.get("/api/cart", headers=headers).json()
    for item in items:
        response = client.delete(f"/api/cart/{item['id']}", headers=headers)
        assert response.status_code == 204


ADMIN = login("admin", "admin123")
USER = login("usuario", "usuario123")


def test_register_and_login():
    unique = uuid.uuid4().hex[:8]
    username = f"usuario{unique}"
    email = f"{username}@ejemplo.com"
    response = client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": "contraseña123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["username"] == username
    assert data["user"]["role"] == "user"
    assert data["token"]

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {data['token']}"})
    assert response.status_code == 200
    assert response.json()["username"] == username


def test_register_duplicate_username():
    response = client.post(
        "/api/auth/register",
        json={"username": "admin", "email": "otro@ejemplo.com", "password": "contraseña123"},
    )
    assert response.status_code == 400


def test_login_invalid_password():
    response = client.post("/api/auth/login", json={"username": "admin", "password": "contraseña-invalid"})
    assert response.status_code == 401


def test_login_missing_fields():
    response = client.post("/api/auth/login", json={"username": "admin"})
    assert response.status_code == 422


def test_me_requires_auth():
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_products_requires_auth():
    response = client.get("/api/products")
    assert response.status_code == 401


def test_admin_lists_seeded_products():
    response = client.get("/api/products", headers=ADMIN)
    assert response.status_code == 200
    names = [product["name"] for product in response.json()]
    for expected in ["Router inalámbrico", "Monitor 24 pulgadas", "Teclado mecánico",
                     "Altavoz Bluetooth", "Teléfono inteligente", "Lámpara de escritorio"]:
        assert expected in names


def test_admin_creates_product():
    product = make_product(ADMIN, name="Adaptador USB-C", price=25.5, stock=4)
    assert product["name"].startswith("Adaptador USB-C-")
    assert product["price"] == 25.5
    assert product["stock"] == 4

    response = client.get("/api/products", headers=ADMIN)
    assert any(p["name"].startswith("Adaptador USB-C-") for p in response.json())


def test_user_cannot_create_product():
    response = client.post(
        "/api/products", headers=USER, json={"name": "Nope", "price": 1, "stock": 1}
    )
    assert response.status_code == 403


def test_search_products():
    response = client.get("/api/products", headers=ADMIN, params={"q": "monitor"})
    assert response.status_code == 200
    names = [product["name"] for product in response.json()]
    assert names, "el catálogo debe devolver productos con el término buscado"
    assert all("monitor" in name.lower() for name in names)

    response = client.get("/api/products", headers=ADMIN, params={"q": "no-existe-nada"})
    assert response.status_code == 200
    assert response.json() == []


def test_get_product_not_found():
    response = client.get("/api/products/999999", headers=ADMIN)
    assert response.status_code == 404


def test_update_product():
    product = make_product(ADMIN, name="Actualiza", price=100.0, stock=2)
    response = client.put(
        f"/api/products/{product['id']}",
        headers=ADMIN,
        json={"name": "Renombrado", "description": "nueva descripción", "price": 150.5, "stock": 7},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Renombrado"
    assert data["price"] == 150.5
    assert data["stock"] == 7

    response = client.put(
        "/api/products/999999", headers=ADMIN, json={"name": "x", "price": 1, "stock": 1}
    )
    assert response.status_code == 404


def test_delete_product():
    product = make_product(ADMIN)
    response = client.delete(f"/api/products/{product['id']}", headers=ADMIN)
    assert response.status_code == 204
    response = client.get(f"/api/products/{product['id']}", headers=ADMIN)
    assert response.status_code == 404
    response = client.delete(f"/api/products/{product['id']}", headers=ADMIN)
    assert response.status_code == 404


def test_cart_add_and_checkout():
    clear_cart(USER)
    product = make_product(ADMIN, price=25.5, stock=4)

    response = client.post("/api/cart", headers=USER, json={"product_id": product["id"], "quantity": 2})
    assert response.status_code == 200
    assert response.json()["quantity"] == 2

    response = client.post("/api/cart", headers=USER, json={"product_id": product["id"], "quantity": 1})
    assert response.status_code == 200
    assert response.json()["quantity"] == 3, "añadir al carro debería sumar a la cantidad existente"

    response = client.post("/api/cart/checkout", headers=USER)
    assert response.status_code == 200, response.text
    order = response.json()
    assert order["status"] == "pending"
    assert order["total"] == pytest.approx(25.5 * 3)
    assert any(
        item["product_id"] == product["id"] and item["quantity"] == 3
        for item in order["items"]
    )

    response = client.get(f"/api/products/{product['id']}", headers=ADMIN)
    assert response.json()["stock"] == 4 - 3, "el checkout debe reducir el stock"

    response = client.get("/api/cart", headers=USER)
    assert response.json() == [], "el carro debe quedar vacío tras el checkout"


def test_checkout_empty_cart():
    clear_cart(USER)
    response = client.post("/api/cart/checkout", headers=USER)
    assert response.status_code == 400


def test_checkout_insufficient_stock():
    clear_cart(USER)
    product = make_product(ADMIN, name="SoloUno", price=10.0, stock=1)
    response = client.post("/api/cart", headers=USER, json={"product_id": product["id"], "quantity": 2})
    assert response.status_code == 200

    response = client.post("/api/cart/checkout", headers=USER)
    assert response.status_code == 409

    response = client.get(f"/api/products/{product['id']}", headers=ADMIN)
    assert response.json()["stock"] == 1, "el checkout fallido no debe cambiar el stock"

    clear_cart(USER)


def test_cart_add_unknown_product():
    response = client.post("/api/cart", headers=USER, json={"product_id": 999999, "quantity": 1})
    assert response.status_code == 404


def test_cart_quantity_update_and_remove():
    clear_cart(USER)
    product = make_product(ADMIN, stock=10)
    response = client.post("/api/cart", headers=USER, json={"product_id": product["id"], "quantity": 2})
    item = response.json()

    response = client.put(f"/api/cart/{item['id']}", headers=USER, json={"quantity": 3})
    assert response.status_code == 200
    assert response.json()["quantity"] == 3

    response = client.put(f"/api/cart/{item['id']}", headers=USER, json={"quantity": 0})
    assert response.status_code == 422

    response = client.put(f"/api/cart/{item['id']}", headers=USER, json={"quantity": -1})
    assert response.status_code == 422

    response = client.delete(f"/api/cart/{item['id']}", headers=USER)
    assert response.status_code == 204
    response = client.get("/api/cart", headers=USER)
    assert response.json() == []


def test_orders_list():
    clear_cart(USER)
    product = make_product(ADMIN, name="ProductoPedido", price=12.5, stock=3)
    client.post("/api/cart", headers=USER, json={"product_id": product["id"], "quantity": 2})
    client.post("/api/cart/checkout", headers=USER)

    response = client.get("/api/orders", headers=USER)
    assert response.status_code == 200
    orders = response.json()
    ours = [o for o in orders if any(i["product_id"] == product["id"] for i in o["items"])]
    assert ours, "el pedido creado debería aparecer en el historial del usuario"
    order = ours[0]
    assert order["total"] == pytest.approx(25.0)

    response = client.get(f"/api/orders/{order['id']}", headers=USER)
    assert response.status_code == 200
    assert any(i["quantity"] == 2 for i in response.json()["items"])

    response = client.post(
        "/api/auth/register",
        json={"username": f"usuario{uuid.uuid4().hex[:8]}",
              "email": f"u{uuid.uuid4().hex[:8]}@ejemplo.com", "password": "contraseña123"},
    )
    other = {"Authorization": f"Bearer {response.json()['token']}"}
    response = client.get(f"/api/orders/{order['id']}", headers=other)
    assert response.status_code == 404, "un usuario no puede ver los pedidos de otro"


def test_admin_orders():
    response = client.get("/api/orders/admin/orders", headers=ADMIN)
    assert response.status_code == 200
    assert len(response.json()) >= 1
    response = client.get("/api/orders/admin/orders", headers=USER)
    assert response.status_code == 403


def test_categories_endpoint():
    response = client.get("/api/products/categories", headers=ADMIN)
    assert response.status_code == 200
    assert "Redes" in response.json()
    response = client.get("/api/products/categories")
    assert response.status_code == 401


def test_best_sellers_endpoint():
    response = client.get("/api/products/best-sellers", headers=ADMIN)
    assert response.status_code == 200
    assert all("id" in p and "sold" in p for p in response.json())


def test_search_by_description():
    response = client.get("/api/products", headers=ADMIN, params={"q": "retroiluminadas"})
    assert response.status_code == 200
    assert "Teclado mecánico" in [p["name"] for p in response.json()]


def test_filter_by_category():
    response = client.get("/api/products", headers=ADMIN, params={"category": "Redes"})
    assert response.status_code == 200
    products = response.json()
    assert products
    assert all(p["category"] == "Redes" for p in products)


def test_sort_by_price():
    response = client.get("/api/products", headers=ADMIN, params={"sort": "price_asc"})
    assert response.status_code == 200
    prices = [p["price"] for p in response.json()]
    assert prices == sorted(prices)
    response = client.get("/api/products", headers=ADMIN, params={"sort": "price_desc"})
    prices = [p["price"] for p in response.json()]
    assert prices == sorted(prices, reverse=True)


def test_product_reviews():
    product = make_product(ADMIN, name="ProductoReseñas", category="Tecnología")
    response = client.post(
        f"/api/products/{product['id']}/reviews",
        headers=USER,
        json={"rating": 5, "comment": "Excelente producto"},
    )
    assert response.status_code == 200
    assert response.json()["user_username"] == "usuario"
    response = client.get(f"/api/products/{product['id']}/reviews", headers=ADMIN)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["rating"] == 5
    response = client.post(
        f"/api/products/{product['id']}/reviews", headers=USER, json={"rating": 6}
    )
    assert response.status_code == 422
    response = client.post("/api/products/999999/reviews", headers=USER, json={"rating": 5})
    assert response.status_code == 404
    response = client.get("/api/products/999999/reviews", headers=ADMIN)
    assert response.status_code == 404


def test_checkout_with_shipping_address():
    clear_cart(USER)
    product = make_product(ADMIN, stock=3)
    client.post("/api/cart", headers=USER, json={"product_id": product["id"], "quantity": 1})
    response = client.post(
        "/api/cart/checkout",
        headers=USER,
        json={"shipping_address": "Calle Falsa 123, Ciudad de México"},
    )
    assert response.status_code == 200
    assert response.json()["shipping_address"] == "Calle Falsa 123, Ciudad de México"
    response = client.get("/api/orders", headers=USER)
    ours = [o for o in response.json() if any(i["product_id"] == product["id"] for i in o["items"])]
    assert ours
    assert ours[0]["shipping_address"] == "Calle Falsa 123, Ciudad de México"


def test_admin_update_order_status():
    clear_cart(USER)
    product = make_product(ADMIN, stock=3)
    client.post("/api/cart", headers=USER, json={"product_id": product["id"], "quantity": 1})
    order = client.post("/api/cart/checkout", headers=USER).json()
    response = client.put(
        f"/api/orders/admin/orders/{order['id']}/status", headers=ADMIN, json={"status": "confirmed"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "confirmed"
    response = client.put(
        f"/api/orders/admin/orders/{order['id']}/status", headers=ADMIN, json={"status": "bogus"}
    )
    assert response.status_code == 400
    response = client.put(
        f"/api/orders/admin/orders/{order['id']}/status", headers=USER, json={"status": "confirmed"}
    )
    assert response.status_code == 403
    response = client.put(
        "/api/orders/admin/orders/999999/status", headers=ADMIN, json={"status": "confirmed"}
    )
    assert response.status_code == 404


def test_admin_inventory():
    response = client.get("/api/products/admin/inventory", headers=ADMIN)
    assert response.status_code == 200
    data = response.json()
    assert data["total_stock"] >= 0
    assert data["total_value"] >= 0
    assert any(p["id"] == 2 for p in data["products"])
    response = client.get("/api/products/admin/inventory", headers=USER)
    assert response.status_code == 403


def test_admin_update_product_stock():
    product = make_product(ADMIN, stock=5)
    response = client.put(
        f"/api/products/{product['id']}/stock", headers=ADMIN, json={"stock": 7}
    )
    assert response.status_code == 200
    assert response.json()["stock"] == 7
    response = client.get(f"/api/products/{product['id']}", headers=ADMIN)
    assert response.json()["stock"] == 7
    response = client.put(f"/api/products/{product['id']}/stock", headers=USER, json={"stock": 1})
    assert response.status_code == 403
    response = client.put(
        f"/api/products/{product['id']}/stock", headers=ADMIN, json={"stock": -1}
    )
    assert response.status_code == 422
    response = client.put(
        "/api/products/999999/stock", headers=ADMIN, json={"stock": 1}
    )
    assert response.status_code == 404


def test_admin_orders_include_username():
    clear_cart(USER)
    product = make_product(ADMIN, stock=3)
    client.post("/api/cart", headers=USER, json={"product_id": product["id"], "quantity": 1})
    client.post("/api/cart/checkout", headers=USER)
    response = client.get("/api/orders/admin/orders", headers=ADMIN)
    assert response.status_code == 200
    ours = [o for o in response.json() if any(i["product_id"] == product["id"] for i in o["items"])]
    assert ours
    assert all(o["user_username"] == "usuario" for o in ours)
