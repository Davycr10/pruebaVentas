from app.auth import hash_password
from app.db import SessionLocal
from app.models import Product, User

DEFAULT_PRODUCTS = [
    (
        "Router inalámbrico",
        "Router Wi-Fi para red interna.",
        149.99,
        5,
        "Redes",
        "products/router-inalambrico.svg",
    ),
    (
        "Monitor 24 pulgadas",
        "Monitor IPS 1080p. Ideal para oficina.",
        299.50,
        10,
        "Computación",
        "products/monitor-24-pulgas.svg",
    ),
    (
        "Teclado mecánico",
        "Teclado mecánico con teclas retroiluminadas.",
        79.90,
        5,
        "Periféricos",
        "products/teclado-mecanico.svg",
    ),
    (
        "Altavoz Bluetooth",
        "Altavoz portátil con bajo potente.",
        45.25,
        3,
        "Audio",
        "products/altavoz-bluetooth.svg",
    ),
    (
        "Teléfono inteligente",
        "Teléfono nuevo para gestión interna.",
        689.00,
        2,
        "Dispositivos",
        "products/telefono-inteligente.svg",
    ),
    (
        "Lámpara de escritorio",
        "Lámpara LED de escritorio con regulador de luz.",
        34.99,
        8,
        "Hogar",
        "products/lampara-escritorio.svg",
    ),
]


def seed() -> None:
    session = SessionLocal()
    try:
        if session.query(User).count() == 0:
            session.add(
                User(username="admin", email="admin@inventario.local", role="admin",
                     password_hash=hash_password("admin123"))
            )
            session.add(
                User(username="usuario", email="usuario@inventario.local", role="user",
                     password_hash=hash_password("usuario123"))
            )
            session.commit()
        if session.query(Product).count() == 0:
            for name, description, price, stock, category, image_url in DEFAULT_PRODUCTS:
                session.add(
                    Product(
                        name=name,
                        description=description,
                        price=price,
                        stock=stock,
                        category=category,
                        image_url=f"/{image_url}",
                    )
                )
            session.commit()
    finally:
        session.close()
