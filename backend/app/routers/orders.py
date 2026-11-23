from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import Order, OrderItem, Product, User
from app.utils import get_current_user, require_admin

router = APIRouter()

ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]


class OrderStatusIn(BaseModel):
    status: str


class OrderOut(BaseModel):
    id: int
    total: float
    status: str
    shipping_address: str | None = None
    created_at: datetime
    user_username: str | None = None
    items: list[dict] = []

    model_config = ConfigDict(from_attributes=True)


def order_out(order: Order, session: Session, include_user: bool = False) -> dict:
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
    user_username = None
    if include_user:
        user = session.get(User, order.user_id)
        user_username = user.username if user else None
    return {
        "id": order.id,
        "total": round(order.total, 2),
        "status": order.status,
        "shipping_address": order.shipping_address,
        "created_at": order.created_at,
        "user_username": user_username,
        "items": items_out,
    }


@router.get("", response_model=list[OrderOut])
def list_orders(user=Depends(get_current_user), session: Session = Depends(get_session)):
    orders = session.query(Order).filter(Order.user_id == user.id).order_by(Order.id.desc()).all()
    return [order_out(order, session) for order in orders]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, user=Depends(get_current_user), session: Session = Depends(get_session)):
    order = session.get(Order, order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return order_out(order, session)


@router.get("/admin/orders", response_model=list[OrderOut])
def admin_orders(user=Depends(require_admin), session: Session = Depends(get_session)):
    orders = session.query(Order).order_by(Order.id.desc()).all()
    return [order_out(order, session, include_user=True) for order in orders]


@router.put("/admin/orders/{order_id}/status", response_model=OrderOut)
def set_order_status(
    order_id: int,
    data: OrderStatusIn,
    user=Depends(require_admin),
    session: Session = Depends(get_session),
):
    order = session.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if data.status not in ORDER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Estado inválido. Valores: {', '.join(ORDER_STATUSES)}",
        )
    order.status = data.status
    session.commit()
    session.refresh(order)
    return order_out(order, session)
