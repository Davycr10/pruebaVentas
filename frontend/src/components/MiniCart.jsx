import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { subscribeToCart } from "../cartStore.js";

export default function MiniCart() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  const load = async () => {
    try {
      setItems(await request("GET", "/cart", { token }));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    return subscribeToCart(load);
  }, [token, location.pathname]);

  const updateQuantity = async (itemId, quantity) => {
    try {
      await request("PUT", `/cart/${itemId}`, { body: { quantity }, token });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await request("DELETE", `/cart/${itemId}`, { token });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const checkout = async () => {
    setError("");
    try {
      await request("POST", "/cart/checkout", {
        token,
        body: { shipping_address: shippingAddress.trim() || null },
      });
      navigate("/orders");
    } catch (err) {
      setError(err.message);
    }
  };

  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  if (!user) return null;

  return (
    <aside className="mini-cart">
      <div className="mini-cart-header">
        <span className="title">Carro{items.length > 0 ? ` (${items.length})` : ""}</span>
      </div>
      {error && (
        <p className="mini-cart-error" role="alert">
          {error}
        </p>
      )}
      <div className="mini-cart-list">
        {items.length === 0 ? <p className="mini-cart-empty">Carro vacío</p> : null}
        {items.map((item) => (
          <div key={item.id} className="mini-cart-item">
            <span className="name">{item.name}</span>
            <span className="price">${Number(item.price).toFixed(2)}</span>
            <div className="mini-cart-qty">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                −
              </button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              <button className="link-btn" onClick={() => removeItem(item.id)}>
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className="mini-cart-footer">
          <label className="shipping-input">
            Dirección de entrega
            <input
              type="text"
              aria-label="Dirección de entrega del pedido"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Opcional"
            />
          </label>
          <p className="total">Total: ${total.toFixed(2)}</p>
          <button onClick={checkout}>Confirmar compra</button>
        </div>
      )}
    </aside>
  );
}
