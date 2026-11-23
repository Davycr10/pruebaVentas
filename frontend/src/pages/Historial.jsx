import { useEffect, useState } from "react";
import { request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Historial() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const isAdmin = user && user.role === "admin";

  const load = async () => {
    try {
      const data = isAdmin
        ? await request("GET", "/orders/admin/orders", { token })
        : await request("GET", "/orders", { token });
      setOrders(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : "");

  return (
    <div>
      <h1>Historial de compras y transacciones</h1>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {orders.length === 0 && !error ? <p className="empty">No hay transacciones registradas.</p> : null}
      <div className="orders">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <strong>Transacción #{order.id}</strong>
            <span className={`status status-${order.status}`}>{order.status}</span>
            <p>{formatDate(order.created_at)}</p>
            <p className="total">Total: ${Number(order.total).toFixed(2)}</p>
            <button className="link-btn" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
              {expanded === order.id ? "Ocultar detalle" : "Ver detalle"}
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
