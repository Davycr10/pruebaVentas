from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import Order, OrderItem, Product, ProductReview, User
from app.utils import get_current_user, require_admin

router = APIRouter()


class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = ""
    price: float = Field(ge=0)
    stock: int = Field(default=0, ge=0)
    category: str = Field(default="general", min_length=1, max_length=50)
    image_url: str = Field(default="", max_length=500)


class ProductOut(BaseModel):
    id: int
    name: str
    description: str
    price: float
    stock: int
    category: str
    image_url: str

    model_config = ConfigDict(from_attributes=True)


class ProductStockIn(BaseModel):
    stock: int = Field(ge=0)


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = ""


class ReviewOut(BaseModel):
    id: int
    user_username: str | None = None
    rating: int
    comment: str
    created_at: object


@router.get("", response_model=list[ProductOut])
def list_products(
    user: object = Depends(get_current_user),
    session: Session = Depends(get_session),
    q: str | None = None,
    category: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    sort: str = "id",
):
    query = session.query(Product)
    if q:
        query = query.filter(or_(Product.name.ilike(f"%{q}%"), Product.description.ilike(f"%{q}%")))
    if category:
        query = query.filter(Product.category == category)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if sort == "name":
        query = query.order_by(Product.name)
    elif sort == "price_asc":
        query = query.order_by(Product.price)
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.id)
    return query.all()


@router.get("/categories")
def product_categories(
    user: object = Depends(get_current_user), session: Session = Depends(get_session)
):
    rows = session.query(Product.category).distinct().order_by(Product.category).all()
    return [row[0] for row in rows if row[0]]


@router.get("/best-sellers")
def best_sellers(
    user: object = Depends(get_current_user), session: Session = Depends(get_session)
):
    query = (
        session.query(
            Product.id, Product.name, Product.price, Product.stock,
            Product.category, Product.image_url,
            func.sum(OrderItem.quantity).label("sold"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .group_by(Product.id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(6)
    )
    rows = query.all()
    return [
        {
            "id": row.id,
            "name": row.name,
            "price": row.price,
            "stock": row.stock,
            "category": row.category,
            "image_url": row.image_url or "",
            "sold": row.sold or 0,
        }
        for row in rows
    ]


@router.get("/admin/inventory")
def admin_inventory(
    user=Depends(require_admin), session: Session = Depends(get_session)
):
    products = session.query(Product).order_by(Product.id).all()
    total_stock = sum(product.stock for product in products)
    total_value = sum(product.stock * product.price for product in products)
    return {
        "total_stock": total_stock,
        "total_value": round(total_value, 2),
        "products": products,
    }


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, user: object = Depends(get_current_user), session: Session = Depends(get_session)):
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


@router.get("/{product_id}/reviews", response_model=list[ReviewOut])
def get_product_reviews(
    product_id: int,
    user: object = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    reviews = (
        session.query(ProductReview)
        .filter(ProductReview.product_id == product_id)
        .order_by(ProductReview.created_at.desc(), ProductReview.id.desc())
        .all()
    )
    out = []
    for review in reviews:
        reviewer = session.get(User, review.user_id)
        out.append(
            {
                "id": review.id,
                "user_username": reviewer.username if reviewer else None,
                "rating": review.rating,
                "comment": review.comment,
                "created_at": review.created_at,
            }
        )
    return out


@router.post("/{product_id}/reviews", response_model=ReviewOut)
def create_product_review(
    product_id: int,
    data: ReviewIn,
    user=Depends(get_current_user),
    session: Session = Depends(get_session),
):
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    review = ProductReview(
        product_id=product_id, user_id=user.id, rating=data.rating, comment=data.comment
    )
    session.add(review)
    session.commit()
    session.refresh(review)
    return {
        "id": review.id,
        "user_username": user.username,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
    }


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductIn, user=Depends(require_admin), session: Session = Depends(get_session)):
    product = Product(
        name=data.name,
        description=data.description,
        price=data.price,
        stock=data.stock,
        category=data.category,
        image_url=data.image_url,
    )
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int, data: ProductIn, user=Depends(require_admin), session: Session = Depends(get_session)
):
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for field, value in data.model_dump().items():
        setattr(product, field, value)
    session.commit()
    session.refresh(product)
    return product


@router.put("/{product_id}/stock", response_model=ProductOut)
def update_product_stock(
    product_id: int, data: ProductStockIn, user=Depends(require_admin), session: Session = Depends(get_session)
):
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    product.stock = data.stock
    session.commit()
    session.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, user=Depends(require_admin), session: Session = Depends(get_session)):
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    session.delete(product)
    session.commit()
