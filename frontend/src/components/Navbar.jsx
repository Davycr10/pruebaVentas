import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { useCartCount } from "./useCartCount.js";
import { currentTheme, nextTheme, THEME_EMOJI, THEME_LABELS } from "../theme.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const cartCount = useCartCount();
  const isAdmin = user && user.role === "admin";
  const [theme, setTheme] = useState(currentTheme());

  const onTheme = () => {
    const next = nextTheme();
    setTheme(next);
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        Inventario Interno
      </Link>
      <nav className="nav">
        <Link to="/">Catálogo</Link>
        <Link to="/cart">Carro{cartCount > 0 ? ` (${cartCount})` : ""}</Link>
        <Link to="/orders">Pedidos</Link>
        <Link to="/historial">Historial</Link>
        {isAdmin && (
          <>
            <Link to="/admin">Administrar productos</Link>
            <Link to="/admin/orders">Administrar pedidos</Link>
          </>
        )}
      </nav>
      <button
        className="theme-toggle"
        title={`Tema: ${THEME_LABELS[theme]}`}
        aria-label={`Cambiar tema (actual: ${THEME_LABELS[theme]})`}
        onClick={onTheme}
      >
        {THEME_EMOJI[theme]} {THEME_LABELS[theme]}
      </button>
      {user && (
        <div className="user">
          <span>Hola, {user.username}</span>
          <button onClick={logout}>Salir</button>
        </div>
      )}
    </header>
  );
}
