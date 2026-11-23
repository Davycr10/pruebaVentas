import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function AdminProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [busyStock, setBusyStock] = useState({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "general",
  });

  const load = async () => {
    const data = await request("GET", "/products", { token });
    setProducts(data);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    request("GET", "/products/categories", { token })
      .then((data) => setCategories(data))
      .catch(() => {});
  }, [token]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", description: "", price: "", stock: "", category: "general" });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      category: form.category,
    };
    if (!payload.name) {
      setError("El nombre es obligatorio");
      return;
    }
    try {
      if (editingId) {
        await request("PUT", `/products/${editingId}`, { body: payload, token });
        setMessage("Producto actualizado.");
      } else {
        await request("POST", "/products", { body: payload, token });
        setMessage("Producto creado.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      category: product.category || "general",
    });
  };

  const remove = async (id) => {
    setError("");
    setMessage("");
    try {
      await request("DELETE", `/products/${id}`, { token });
      setMessage("Producto eliminado.");
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const adjustStock = async (productId, delta) => {
    setBusyStock((map) => ({ ...map, [productId]: true }));
    setError("");
    setMessage("");
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    try {
      await request("PUT", `/products/${productId}/stock`, {
        body: { stock: product.stock + delta },
        token,
      });
      setMessage(`Stock ajustado a ${product.stock + delta}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyStock((map) => ({ ...map, [productId]: false }));
    }
  };

  return (
    <div>
      <div className="actions">
        <Link to="/admin/inventory" className="link-btn">
          Ver inventario consolidado
        </Link>
        <Link to="/admin/orders" className="link-btn">
          Ver pedidos
        </Link>
      </div>
      <h1>Administrar productos</h1>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && <p className="success">{message}</p>}
      <form className="card" onSubmit={submit}>
        <h2>{editingId ? `Editar producto #${editingId}` : "Nuevo producto"}</h2>
        <div className="form-row">
          <label>
            Nombre
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre"
            />
          </label>
          <label>
            Descripción
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción"
            />
          </label>
          <label>
            Precio
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Precio"
            />
          </label>
          <label>
            Stock
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="Stock"
            />
          </label>
          <label>
            Categoría
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="general">General</option>
              {categories.filter((c) => c !== "general").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="actions">
          <button type="submit">{editingId ? "Guardar cambios" : "Crear producto"}</button>
          {editingId && (
            <button type="button" onClick={resetForm}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>
      <div className="products">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            {product.category && <span className="chip-category">{product.category}</span>}
            <p className="desc">{product.description || "Sin descripción"}</p>
            <div className="stock-row">
              <button onClick={() => adjustStock(product.id, -1)} disabled={busyStock[product.id]}>
                −
              </button>
              <span>Stock: {product.stock}</span>
              <button onClick={() => adjustStock(product.id, 1)} disabled={busyStock[product.id]}>
                +
              </button>
            </div>
            <div className="actions">
              <button onClick={() => startEdit(product)}>Editar</button>
              <button onClick={() => remove(product.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
