import { useEffect, useState } from "react";
import { request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function AdminInventory() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    request("GET", "/products/admin/inventory", { token })
      .then((inventory) => setData(inventory))
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <div>
        <h1>Inventario consolidado</h1>
        <p className="error" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h1>Inventario consolidado</h1>
        <p className="empty">Cargando...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Inventario consolidado</h1>
      <div className="inventory-summary">
        <div className="stat-card">
          <strong>{data.total_stock}</strong>
          <span>Total en stock</span>
        </div>
        <div className="stat-card">
          <strong>${Number(data.total_value).toFixed(2)}</strong>
          <span>Valor total del inventario</span>
        </div>
      </div>
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {data.products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>${Number(product.price).toFixed(2)}</td>
              <td>{product.stock}</td>
              <td>${(Number(product.price) * product.stock).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
