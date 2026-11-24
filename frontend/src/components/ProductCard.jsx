import { Link } from "react-router-dom";

export default function ProductCard({ product, onCart, featured = false }) {
  return (
    <div className={featured ? "product-card product-card-featured" : "product-card"}>
      {product.image_url ? (
        <div className="product-card-image">
          <img src={product.image_url} alt={product.name} loading="lazy" />
        </div>
      ) : (
        <div className="product-card-image">
          <span className="product-card-image-placeholder">
            {product.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <div className="product-card-body">
        <div className="product-card-meta">
          {product.category && <span className="product-card-category">{product.category}</span>}
          {featured && typeof product.sold === "number" && product.sold > 0 && (
            <span className="featured-badge">
              {product.sold} vendidos
            </span>
          )}
        </div>
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-card-desc">{product.description || "Sin descripción"}</p>
        <p className="product-card-price">${Number(product.price).toFixed(2)}</p>
        <span
          className={`stock-tag stock-tag-${product.stock > 0 ? "ok" : product.stock === 0 ? "none" : "low"}`}
        >
          {product.stock > 0 ? `Disponible: ${product.stock}` : "Sin stock"}
        </span>
        <div className="product-card-actions">
          <button
            className="btn-buy"
            onClick={() => onCart(product.id, 1, { buyNow: true })}
            disabled={product.stock <= 0}
          >
            Comprar ahora
          </button>
          <Link to={`/product/${product.id}`} className="btn-outline">
            Ver detalle
          </Link>
        </div>
      </div>
    </div>
  );
}
