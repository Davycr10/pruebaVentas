export async function request(method, path, { body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  if (response.status !== 204) {
    data = await response.json().catch(() => null);
  }
  if (!response.ok) {
    const detail = data && data.detail;
    let message;
    if (Array.isArray(detail)) {
      message = detail.map((d) => d.msg || d.error || String(d)).join("; ");
    } else {
      message = String(detail || `Error ${response.status}`);
    }
    throw new Error(message);
  }
  return data;
}

export async function forgotPassword(login) {
  return request("POST", "/auth/forgot-password", { body: { login } });
}

export async function resetPassword(token, password) {
  return request("POST", "/auth/reset-password", { body: { token, password } });
}
