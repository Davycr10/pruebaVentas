export const THEME_ORDER = ["light", "dark", "vibrante"];

export const THEME_LABELS = {
  light: "Clásico",
  dark: "Oscuro",
  vibrante: "Vibrante",
};

export const THEME_EMOJI = {
  light: "☀️",
  dark: "🌙",
  vibrante: "✨",
};

export function currentTheme() {
  return localStorage.getItem("theme") || "light";
}

export function applyTheme(theme) {
  localStorage.setItem("theme", theme);
  document.body.dataset.theme = theme;
  return theme;
}

export function nextTheme() {
  const order = THEME_ORDER;
  const cur = currentTheme();
  const idx = order.indexOf(cur);
  return applyTheme(order[(idx + 1) % order.length]);
}
