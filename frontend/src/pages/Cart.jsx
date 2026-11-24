import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Cart() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  const load = async () => {
    const data = await request("GET", "/cart", { token });
    setItems(data);
    setError("");
    setLoading(false);
  };

  useEffect(() => {
    load().catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  }, [token]);

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

  if (loading) {
    return <p className="empty">Cargando el carro...</p>;
  }

  return (
    <div>
      <h1>Carro de compras</h1>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {items.length === 0 ? (
        <p className="empty">Tu carro está vacío.</p>
      ) : (
        <>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="cart-product">
                      {item.image_url && <img src={item.image_url} alt={item.name} />}
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td>${Number(item.price).toFixed(2)}</td>
                  <td>
                    <div className="cart-qty">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <label className="shipping-input">
            Dirección de entrega (opcional)
            <input
              type="text"
              aria-label="Dirección de entrega"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Calle Falsa 123, Ciudad de México"
            />
          </label>
          <div className="cart-total-box">
            <span className="total">Total: ${total.toFixed(2)}</span>
            <button onClick={checkout}>Confirmar compra</button>
          </div>
        </>
      )}
    </div>
  );
}
