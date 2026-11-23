import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export function useCartCount() {
  const { token } = useAuth();
  const location = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setCount(0);
      return;
    }
    request("GET", "/cart", { token })
      .then((items) => setCount(items.length))
      .catch(() => setCount(0));
  }, [token, location.pathname]);

  return count;
}
