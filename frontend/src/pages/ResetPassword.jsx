import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../api.js";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setPending(true);
    try {
      await resetPassword(token.trim(), password);
      setSuccess("¡Listo! Inicia sesión con tu nueva contraseña.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Restablecer contraseña</h2>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="success" role="status">
          {success}
        </p>
      )}
      <label>
        Código de restablecimiento
        <input
          type="text"
          aria-label="Código de restablecimiento"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          maxLength={6}
        />
      </label>
      <label>
        Nueva contraseña
        <input
          type="password"
          aria-label="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </label>
      <label>
        Confirmar contraseña
        <input
          type="password"
          aria-label="Confirmar contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
        />
      </label>
      <button type="submit" disabled={pending}>
        Restablecer contraseña
      </button>
      <p>
        <Link to="/forgot-password">¿Necesitas otro código?</Link>
      </p>
    </form>
  );
}
