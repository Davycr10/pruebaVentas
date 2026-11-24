import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../api.js";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setPending(true);
    try {
      await forgotPassword(login.trim());
      setSuccess("Revisa tu correo electrónico; ahí tienes el código para restablecer tu contraseña.");
      setTimeout(() => navigate("/reset-password"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Olvidé mi contraseña</h2>
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
        Usuario o email
        <input
          type="text"
          aria-label="Usuario o email"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
        />
      </label>
      <button type="submit" disabled={pending}>
        Enviar código
      </button>
      <p>
        <Link to="/login">Volver al inicio de sesión</Link>
      </p>
    </form>
  );
}
