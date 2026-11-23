import pkg from "../package.json";

// Versión del APK/app: se actualiza al construir el APK (package.json).
// El servidor sirve la versión actual (package.json del proyecto) en GET /app/version.
// Si el usuario tiene una app más antigua, aparece un banner de "Actualización disponible".
export const APP_VERSION = pkg.version;
