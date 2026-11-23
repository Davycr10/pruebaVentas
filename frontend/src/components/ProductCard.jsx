import { Link } from "react-router-dom";

export default function ProductCard({ product, onCart }) {
  return (
    <div className="product-card">
      <div className="card-top">
        <h3>{product.name}</h3>
        <button
          type="button"
          className="add-to-cart"
          title={`Agregar ${product.name} al carro`}
          aria-label={`Agregar ${product.name} al carro`}
          onClick={() => onCart(product.id, 1)}
        >
          🛒
        </button>
      </div>
      {product.image_url ? (
        <img className="product-image" src={product.image_url} alt={product.name} loading="lazy" />
      ) : (
        <div className="product-image-placeholder">{product.name.slice(0, 2).toUpperCase()}</div>
      )}
      {product.category && <span className="chip-category">{product.category}</span>}
      <p className="desc">{product.description || "Sin descripción"}</p>
      <p className="price">${Number(product.price).toFixed(2)}</p>
      <span className={product.stock > 0 ? "stock ok" : "stock low"}>Stock: {product.stock}</span>
      <div className="actions">
        <Link to={`/product/${product.id}`} className="link-btn">
          Ver detalle
        </Link>
        <button className="buy-now" onClick={() => onCart(product.id, 1, { buyNow: true })}>
          Comprar ahora
        </button>
      </div>
    </div>
  );
}
