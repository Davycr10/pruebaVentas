from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import CartItem, Order, OrderItem, Product
from app.utils import get_current_user

router = APIRouter()


class CartItemIn(BaseModel):
    product_id: int = Field(ge=1)
    quantity: int = Field(default=1, ge=1)


class CartItemUpdateIn(BaseModel):
    quantity: int = Field(ge=1)


class CartItemOut(BaseModel):
    id: int
    product_id: int
    name: str
    price: float
    stock: int
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    name: str
    price: float
    quantity: int


class OrderOut(BaseModel):
    id: int
    total: float
    status: str
    shipping_address: str | None = None
    created_at: datetime
    items: list[OrderItemOut] = []


class CheckoutIn(BaseModel):
    shipping_address: str | None = None


def cart_item_out(item: CartItem, session: Session) -> dict:
    product = session.get(Product, item.product_id)
    return {
        "id": item.id,
        "product_id": item.product_id,
        "name": product.name if product else f"Producto #{item.product_id}",
        "price": product.price if product else 0.0,
        "stock": product.stock if product else 0,
        "quantity": item.quantity,
    }


def order_out(order: Order, session: Session) -> dict:
    items = session.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    items_out = []
    for item in items:
        product = session.get(Product, item.product_id)
        items_out.append(
            {
                "id": item.id,
                "product_id": item.product_id,
                "name": product.name if product else f"Producto #{item.product_id}",
                "price": item.price,
                "quantity": item.quantity,
            }
        )
    return {
        "id": order.id,
        "total": round(order.total, 2),
        "status": order.status,
        "shipping_address": order.shipping_address,
        "created_at": order.created_at,
        "items": items_out,
    }


@router.get("", response_model=list[CartItemOut])
def list_cart(user=Depends(get_current_user), session: Session = Depends(get_session)):
    items = session.query(CartItem).filter(CartItem.user_id == user.id).all()
    return [cart_item_out(item, session) for item in items]


@router.post("", response_model=CartItemOut, status_code=status.HTTP_200_OK)
def add_to_cart(data: CartItemIn, user=Depends(get_current_user), session: Session = Depends(get_session)):
    product = session.get(Product, data.product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    item = session.query(CartItem).filter(
        CartItem.user_id == user.id, CartItem.product_id == data.product_id
    ).first()
    if item is None:
        item = CartItem(user_id=user.id, product_id=data.product_id, quantity=data.quantity)
        session.add(item)
    else:
        item.quantity += data.quantity
    session.commit()
    session.refresh(item)
    return cart_item_out(item, session)


@router.put("/{item_id}", response_model=CartItemOut)
def update_cart_item(
    item_id: int, data: CartItemUpdateIn, user=Depends(get_current_user), session: Session = Depends(get_session)
):
    item = session.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == user.id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item del carro no encontrado")
    item.quantity = data.quantity
    session.commit()
    session.refresh(item)
    return cart_item_out(item, session)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cart_item(item_id: int, user=Depends(get_current_user), session: Session = Depends(get_session)):
    item = session.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == user.id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item del carro no encontrado")
    session.delete(item)
    session.commit()


@router.post("/checkout", response_model=OrderOut)
def checkout(
    data: CheckoutIn | None = None,
    user=Depends(get_current_user),
    session: Session = Depends(get_session),
):
    items = session.query(CartItem).filter(CartItem.user_id == user.id).all()
    if not items:
        raise HTTPException(status_code=400, detail="El carro está vacío")

    order_items = []
    total = 0.0
    for item in items:
        product = session.get(Product, item.product_id)
        if product is None:
            raise HTTPException(status_code=409, detail=f"Producto #{item.product_id} no está disponible")
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=409,
                detail=f"Stock insuficiente para '{product.name}' (disponible {product.stock})",
            )
        order_items.append(OrderItem(product_id=product.id, quantity=item.quantity, price=product.price))
        total += product.price * item.quantity
        product.stock -= item.quantity
        session.delete(item)

    shipping_address = data.shipping_address if data else None
    order = Order(
        user_id=user.id,
        total=round(total, 2),
        status="pending",
        shipping_address=shipping_address or None,
    )
    session.add(order)
    session.flush()
    for order_item in order_items:
        order_item.order_id = order.id
        session.add(order_item)
    session.commit()
    session.refresh(order)
    return order_out(order, session)
