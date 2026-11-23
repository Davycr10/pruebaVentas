import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { bumpCartVersion } from "../cartStore.js";
import ProductCard from "../components/ProductCard.jsx";

const RATINGS = [1, 2, 3, 4, 5];

const ratingStars = (value) =>
  RATINGS.map((star) => (star <= Math.round(value) ? "★" : "☆")).join("");

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [addingReview, setAddingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [similar, setSimilar] = useState([]);

  const reloadReviews = async () => {
    const data = await request("GET", `/products/${id}/reviews`, { token });
    setReviews(data);
    const total = data.length;
    setAverageRating(total ? data.reduce((sum, r) => sum + r.rating, 0) / total : null);
  };

  useEffect(() => {
    request("GET", `/products/${id}`, { token })
      .then((data) => setProduct(data))
      .catch((err) => setError(err.message));
  }, [id, token]);

  useEffect(() => {
    reloadReviews().catch(() => {});
  }, [id, token]);

  useEffect(() => {
    if (!product || !product.category) return;
    request("GET", `/products?category=${encodeURIComponent(product.category)}`, { token })
      .then((list) => setSimilar(list.filter((p) => p.id !== product.id).slice(0, 4)))
      .catch(() => {});
  }, [product, token]);

  const addToCartForSimilar = async (productId, quantity, opts) => {
    setError("");
    try {
      await request("POST", "/cart", { body: { product_id: productId, quantity }, token });
      bumpCartVersion();
      if (opts && opts.buyNow) navigate("/cart");
    } catch (err) {
      setError(err.message);
    }
  };

  const addToCart = async () => {
    setAdding(true);
    setMessage("");
    setError("");
    try {
      await request("POST", "/cart", { body: { product_id: product.id, quantity }, token });
      setMessage(`Producto agregado al carro (${quantity}).`);
      setQuantity(1);
      bumpCartVersion();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const buyNow = async () => {
    setError("");
    try {
      await request("POST", "/cart", { body: { product_id: product.id, quantity }, token });
      bumpCartVersion();
      navigate("/cart");
    } catch (err) {
      setError(err.message);
    }
  };

  const addReview = async () => {
    setAddingReview(true);
    setReviewError("");
    try {
      await request("POST", `/products/${id}/reviews`, {
        body: { rating: reviewRating, comment: reviewComment.trim() },
        token,
      });
      setReviewComment("");
      setReviewRating(5);
      await reloadReviews();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setAddingReview(false);
    }
  };

  if (!product) {
    return (
      <div>
        <p>{error || "Cargando..."}</p>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <div className="detail-header">
        <div className="detail-media">
          {product.image_url ? (
            <img className="detail-image" src={product.image_url} alt={product.name} />
          ) : (
            <div className="product-image-placeholder">{product.name.slice(0, 2).toUpperCase()}</div>
          )}
        </div>
        <div className="detail-info">
          <h1>{product.name}</h1>
          <div className="detail-price">${Number(product.price).toFixed(2)}</div>
          <div className="detail-meta">
            {product.category && <span className="chip-category">{product.category}</span>}
            <span className={product.stock > 0 ? "stock ok" : "stock low"}>
              Stock: {product.stock}
            </span>
          </div>
          <p className="desc">{product.description || "Sin descripción"}</p>
          <div className="actions">
            <button className="buy-now" onClick={buyNow}>
              Comprar ahora
            </button>
            <button onClick={addToCart} disabled={adding}>
              Agregar al carro
            </button>
            {message && <p className="success">{message}</p>}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="detail-specs">
        <h2>Detalles y especificaciones</h2>
        <table className="specs-table">
          <tbody>
            <tr>
              <th>Categoría</th>
              <td>{product.category || "-"}</td>
            </tr>
            <tr>
              <th>Precio</th>
              <td>${Number(product.price).toFixed(2)}</td>
            </tr>
            <tr>
              <th>Stock disponible</th>
              <td>{product.stock} unidades</td>
            </tr>
            <tr>
              <th>Descripción</th>
              <td>{product.description || "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="reviews-section">
        <h2>Opiniones ({reviews.length})</h2>
        {averageRating !== null && (
          <div className="rating-summary">
            <strong>Calificación:</strong>{" "}
            <span className="stars">{ratingStars(averageRating)}</span>{" "}
            <span>({Math.round(averageRating)}/5 · {reviews.length} opiniones)</span>
          </div>
        )}
        {reviews.length === 0 ? <p className="empty">Aún no hay opiniones.</p> : null}
        <ul className="review-list">
          {reviews.map((review) => (
            <li key={review.id} className="review">
              <div className="review-head">
                <span className="review-user">{review.user_username || "Cliente"}</span>
                <span className="review-stars">{ratingStars(review.rating)}</span>
                <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
              </div>
              {review.comment && <p className="review-comment">{review.comment}</p>}
            </li>
          ))}
        </ul>
        <form className="card add-review" onSubmit={(e) => { e.preventDefault(); addReview(); }}>
          <h3>Deja tu opinión</h3>
          <label>
            Calificación
            <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
              {RATINGS.map((value) => (
                <option key={value} value={value}>{value} ★</option>
              ))}
            </select>
          </label>
          <label>
            Comentario
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              placeholder="Tu opinión sobre el producto..."
            />
          </label>
          <div className="actions">
            <button type="submit" disabled={addingReview}>
              Enviar opinión
            </button>
          </div>
          {reviewError && <p className="error">{reviewError}</p>}
        </form>
      </div>

      {similar.length > 0 && (
        <div className="similar-section">
          <h2>Productos similares</h2>
          <div className="products">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} onCart={addToCartForSimilar} />
            ))}
          </div>
        </div>
      )}

      <div className="actions">
        <Link to="/" className="link-btn">
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}
