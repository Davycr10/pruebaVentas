import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <h4>Inventario Interno</h4>
          <p className="muted">Plataforma de gestión de compras y ventas internas.</p>
        </div>
        <div className="footer-col">
          <h4>Enlaces</h4>
          <Link to="/about" className="link-btn">Acerca de nosotros</Link>
          <Link to="/faq" className="link-btn">FAQ</Link>
          <Link to="/historial" className="link-btn">Historial de compras</Link>
        </div>
        <div className="footer-col">
          <h4>Contacto</h4>
          <p>interno@inventario.local</p>
        </div>
      </div>
      <div className="footer-bottom">
        Inventario Interno © {new Date().getFullYear()} — Todos los derechos reservados.
      </div>
    </footer>
  );
}
