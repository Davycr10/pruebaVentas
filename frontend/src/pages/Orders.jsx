import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Orders() {
  const { token } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    request("GET", "/orders", { token })
      .then((data) => {
        setOrders(data);
        if (location.state && location.state.highlight) {
          setExpanded(location.state.highlight);
        }
      })
      .catch((err) => setError(err.message));
  }, [token]);

  const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : "");

  return (
    <div>
      <h1>Mis pedidos</h1>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {orders.length === 0 && !error ? <p className="empty">No hay pedidos.</p> : null}
      <div className="orders">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <strong>Pedido #{order.id}</strong>
            <span className={`status status-${order.status}`}>{order.status}</span>
            <p>{formatDate(order.created_at)}</p>
            {order.shipping_address && (
              <p className="address">Dirección de entrega: {order.shipping_address}</p>
            )}
            <p className="total">Total: ${Number(order.total).toFixed(2)}</p>
            <button
              className="link-btn"
              onClick={() => setExpanded(expanded === order.id ? null : order.id)}
            >
              {expanded === order.id ? "Ocultar" : "Ver detalle"}
            </button>
            {expanded === order.id && (
              <ul>
                {(order.items || []).map((item) => (
                  <li key={item.id}>
                    {item.name} × {item.quantity} — ${Number(item.price).toFixed(2)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
