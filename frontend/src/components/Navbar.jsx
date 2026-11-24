import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { useCartCount } from "./useCartCount.js";
import { currentTheme, nextTheme, THEME_EMOJI, THEME_LABELS } from "../theme.js";

export default function Navbar({ searchQuery, onSearchChange }) {
  const { user, logout } = useAuth();
  const cartCount = useCartCount();
  const isAdmin = user && user.role === "admin";
  const [theme, setTheme] = useState(currentTheme());
  const location = useLocation();
  const navigate = useNavigate();

  const onTheme = () => {
    const next = nextTheme();
    setTheme(next);
  };

  const onSearch = (event) => {
    event.preventDefault();
    onSearchChange(searchQuery.trim());
    if (location.pathname !== "/") navigate("/");
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        Inventario Interno
      </Link>
      <form className="navbar-search" onSubmit={onSearch} role="search">
        <input
          type="search"
          className="navbar-search-input"
          aria-label="Buscar productos"
          placeholder="Buscar productos, categorías..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button type="submit" className="navbar-search-submit" aria-label="Buscar">
          Buscar
        </button>
      </form>
      <nav className="nav">
        {user && <Link to="/cart">Carro{cartCount > 0 ? ` (${cartCount})` : ""}</Link>}
        <Link to="/orders">Pedidos</Link>
        <Link to="/historial">Historial</Link>
        {isAdmin && (
          <>
            <Link to="/admin">Administrar productos</Link>
            <Link to="/admin/orders">Administrar pedidos</Link>
          </>
        )}
      </nav>
      {user && (
        <div className="user">
          <span>Hola, {user.username}</span>
          <button className="user-logout" onClick={logout}>
            Salir
          </button>
        </div>
      )}
      <button
        className="theme-toggle"
        title={`Tema: ${THEME_LABELS[theme]}`}
        aria-label={`Cambiar tema (actual: ${THEME_LABELS[theme]})`}
        onClick={onTheme}
      >
        {THEME_EMOJI[theme]} {THEME_LABELS[theme]}
      </button>
    </header>
  );
}
