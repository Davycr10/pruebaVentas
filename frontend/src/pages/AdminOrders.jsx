import { useEffect, useState } from "react";
import { request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    request("GET", "/orders/admin/orders", { token })
      .then((data) => setOrders(data))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, [token]);

  const updateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await request("PUT", `/orders/admin/orders/${orderId}/status`, { body: { status }, token });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const expandedOrder = expanded !== null ? orders.find((o) => o.id === expanded) : null;

  const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : "");

  return (
    <div>
      <h1>Administrar pedidos</h1>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {orders.length === 0 && !error ? <p className="empty">No hay pedidos.</p> : null}
      <table className="admin-orders-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Usuario</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Dirección</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>#{order.id}</td>
              <td>{order.user_username || "-"}</td>
              <td>{formatDate(order.created_at)}</td>
              <td>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  disabled={updatingId === order.id}
                  aria-label={`Estado del pedido #${order.id}`}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td className="shipping-cell">{order.shipping_address || "—"}</td>
              <td>${Number(order.total).toFixed(2)}</td>
              <td>
                <button
                  className="link-btn"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  {expanded === order.id ? "Ocultar" : "Ver detalle"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {expandedOrder && (
        <div className="card order-detail">
          <h2>
            Pedido #{expandedOrder.id}
            {expandedOrder.user_username ? ` (${expandedOrder.user_username})` : ""}
          </h2>
          <p>Total: ${Number(expandedOrder.total).toFixed(2)}</p>
          {expandedOrder.shipping_address && (
            <p className="address">Dirección de entrega: {expandedOrder.shipping_address}</p>
          )}
          <ul>
            {(expandedOrder.items || []).map((item) => (
              <li key={item.id}>
                {item.name} × {item.quantity} — ${Number(item.price).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
