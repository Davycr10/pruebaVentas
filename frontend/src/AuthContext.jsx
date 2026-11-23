import { createContext, useContext, useEffect, useState } from "react";
import { request } from "./api.js";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth() debe estar dentro de un AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearToken = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const me = async (stored) => {
    if (!stored) return;
    try {
      const data = await request("GET", "/auth/me", { token: stored });
      setUser(data);
    } catch {
      clearToken();
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("token");
    setToken(stored);
    me(stored).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username, password) => {
    const data = await request("POST", "/auth/login", { body: { username, password } });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password) => {
    const data = await request("POST", "/auth/register", { body: { username, email, password } });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
