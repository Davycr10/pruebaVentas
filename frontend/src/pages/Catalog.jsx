import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { bumpCartVersion } from "../cartStore.js";
import ProductCard from "../components/ProductCard.jsx";

export default function Catalog() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("id");
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");

  const loadProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      if (minPrice !== "") params.set("min_price", minPrice);
      if (maxPrice !== "") params.set("max_price", maxPrice);
      if (sort !== "id") params.set("sort", sort);
      const res = await request("GET", `/products?${params.toString()}`, { token });
      setProducts(res);
      setError("");
    } catch (err) {
      setError(err.message);
      setProducts([]);
    }
  };

  const loadCategories = async () => {
    try {
      setCategories(await request("GET", "/products/categories", { token }));
    } catch (err) {
      // ignore
    }
  };

  const loadBestSellers = async () => {
    try {
      setBestSellers(await request("GET", "/products/best-sellers", { token }));
    } catch (err) {
      setBestSellers([]);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [query, category, minPrice, maxPrice, sort]);

  useEffect(() => {
    loadCategories();
    loadBestSellers();
  }, [token]);

  const addToCart = async (productId, quantity = 1, { buyNow = false } = {}) => {
    setCartError("");
    try {
      await request("POST", "/cart", { body: { product_id: productId, quantity }, token });
      bumpCartVersion();
      if (buyNow) navigate("/cart");
    } catch (err) {
      setCartError(err.message);
    }
  };

  return (
    <div>
      <h1>Catálogo de productos</h1>
      <div className="catalog-filters">
        <input
          type="search"
          className="search"
          aria-label="Buscar productos"
          placeholder="Buscar productos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="sort-select"
          aria-label="Ordenar"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="id">Nuevos</option>
          <option value="name">Nombre A-Z</option>
          <option value="price_asc">Precio: bajo a alto</option>
          <option value="price_desc">Precio: alto a bajo</option>
        </select>
        <label className="price-filter">
          Desde
          <input
            type="number"
            step="0.01"
            min="0"
            className="price-input"
            aria-label="Precio mínimo"
            placeholder="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </label>
        <label className="price-filter">
          Hasta
          <input
            type="number"
            step="0.01"
            min="0"
            className="price-input"
            aria-label="Precio máximo"
            placeholder="∞"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </label>
      </div>
      {categories.length > 0 && (
        <div className="category-chips" role="group" aria-label="Filtrar por categoría">
          <button className={category === "" ? "chip active" : "chip"} onClick={() => setCategory("")}>
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={category === c ? "chip active" : "chip"}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {cartError && (
        <p className="error" role="alert">
          {cartError}
        </p>
      )}
      {bestSellers.length > 0 && (
        <>
          <h2>Destacados (más vendidos)</h2>
          <div className="products">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} onCart={addToCart} />
            ))}
          </div>
        </>
      )}
      <h2>Productos</h2>
      <div className="products">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onCart={addToCart} />
        ))}
        {products.length === 0 && !error ? <p className="empty">No hay productos que mostrar.</p> : null}
      </div>
    </div>
  );
}
