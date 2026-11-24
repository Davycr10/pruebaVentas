import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import About from "./pages/About.jsx";
import AdminInventory from "./pages/AdminInventory.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import AdminProducts from "./pages/AdminProducts.jsx";
import Cart from "./pages/Cart.jsx";
import Catalog from "./pages/Catalog.jsx";
import FAQ from "./pages/FAQ.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Login from "./pages/Login.jsx";
import Navbar from "./components/Navbar.jsx";
import Orders from "./pages/Orders.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Register from "./pages/Register.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Historial from "./pages/Historial.jsx";
import MiniCart from "./components/MiniCart.jsx";
import Footer from "./components/Footer.jsx";
import { APP_VERSION } from "./appVersion.js";
import { currentTheme } from "./theme.js";

export default function App() {
  const { user, loading } = useAuth();
  const isAdmin = user && user.role === "admin";
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadError, setDownloadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.body.dataset.theme = currentTheme();
  }, []);

  useEffect(() => {
    fetch("/app/version")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.version && data.version !== APP_VERSION) {
          setUpdateInfo({ serverVersion: data.version, currentVersion: APP_VERSION });
        }
      })
      .catch(() => {});
  }, []);

  const downloadApk = async () => {
    setDownloadError("");
    try {
      const res = await fetch("/app.apk");
      if (!res.ok) throw new Error("La APK aún no está disponible.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "InventarioInterno.apk";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setDownloadError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <p>Cargando...</p>
      </div>
    );
  }

  const guard = (page) => (user ? page : <Navigate to="/login" replace />);

  return (
    <div className="app">
      {updateInfo && (
        <div className="update-banner" role="alert">
          <strong>Actualización disponible v{updateInfo.serverVersion}</strong>
          <p className="update-banner-text">
            Tu versión: v{updateInfo.currentVersion}. Descarga e instala la nueva APK para recibir los
            últimos cambios.
          </p>
          {downloadError && (
            <p className="update-banner-error">{downloadError}</p>
          )}
          <button onClick={downloadApk}>Descargar e instalar APK</button>
          <button className="link-btn" onClick={() => setUpdateInfo(null)}>
            Ignorar ahora
          </button>
        </div>
      )}
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main>
        <Routes>
          <Route path="/" element={guard(<Catalog searchQuery={searchQuery} />)} />
          <Route path="/product/:id" element={guard(<ProductDetail />)} />
          <Route path="/cart" element={guard(<Cart />)} />
          <Route path="/orders" element={guard(<Orders />)} />
          <Route path="/historial" element={guard(<Historial />)} />
          <Route
            path="/admin"
            element={isAdmin ? guard(<AdminProducts />) : <Navigate to="/" replace />}
          />
          <Route
            path="/admin/orders"
            element={isAdmin ? guard(<AdminOrders />) : <Navigate to="/" replace />}
          />
          <Route
            path="/admin/inventory"
            element={isAdmin ? guard(<AdminInventory />) : <Navigate to="/" replace />}
          />
          <Route path="/about" element={guard(<About />)} />
          <Route path="/faq" element={guard(<FAQ />)} />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </main>
      <MiniCart />
      <Footer />
    </div>
  );
}
