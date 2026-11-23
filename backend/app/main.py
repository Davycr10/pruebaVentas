from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.db import engine
from app.models import Base
from app.routers import auth, cart, orders, products
from app.seed import seed


def run_migrations() -> None:
    """Añade columnas a la tabla products existente (categoría, imagen) y a orders (dirección de envío).

    Además, asigna categorías e imágenes a los productos semilla existentes.
    """
    with engine.connect() as conn:
        product_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(products)"))}
        if "category" not in product_columns:
            conn.execute(
                text("ALTER TABLE products ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'general'")
            )
        if "image_url" not in product_columns:
            conn.execute(text("ALTER TABLE products ADD COLUMN image_url VARCHAR(500) NOT NULL DEFAULT ''"))
        order_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(orders)"))}
        if "shipping_address" not in order_columns:
            conn.execute(text("ALTER TABLE orders ADD COLUMN shipping_address TEXT"))
        conn.execute(
            text(
                """
                UPDATE products
                SET category = CASE name
                    WHEN 'Router inalámbrico' THEN 'Redes'
                    WHEN 'Monitor 24 pulgadas' THEN 'Computación'
                    WHEN 'Teclado mecánico' THEN 'Periféricos'
                    WHEN 'Altavoz Bluetooth' THEN 'Audio'
                    WHEN 'Teléfono inteligente' THEN 'Dispositivos'
                    WHEN 'Lámpara de escritorio' THEN 'Hogar'
                    ELSE category END,
                    image_url = CASE name
                    WHEN 'Router inalámbrico' THEN '/products/router-inalambrico.svg'
                    WHEN 'Monitor 24 pulgadas' THEN '/products/monitor-24-pulgas.svg'
                    WHEN 'Teclado mecánico' THEN '/products/teclado-mecanico.svg'
                    WHEN 'Altavoz Bluetooth' THEN '/products/altavoz-bluetooth.svg'
                    WHEN 'Teléfono inteligente' THEN '/products/telefono-inteligente.svg'
                    WHEN 'Lámpara de escritorio' THEN '/products/lampara-escritorio.svg'
                    ELSE image_url END
                WHERE category = 'general' AND image_url = ''
                """
            )
        )
        conn.commit()


Base.metadata.create_all(bind=engine)
run_migrations()
seed()

app = FastAPI(title="Inventario Interno", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(cart.router, prefix="/api/cart", tags=["cart"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
