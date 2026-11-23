// Servidor Node para Inventario Interno:
//  - Sirve el build estático de frontend/dist (single page app).
//  - Hace proxy de /api/* a la API FastAPI que corre en http://127.0.0.1:8000.
// Uso: node frontend/server.cjs --port 3000

const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "dist");
const BACKEND = "http://127.0.0.1:8000";
const PORT = Number(process.env.PORT) || 3000;
const PKG = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
const APK_PATH = path.join(DIST, "app.apk");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("No encontrado");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "content-type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function handleApi(req, res) {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", async () => {
    const body = Buffer.concat(chunks).toString("utf8");
    const headers = {};
    for (const [name, value] of Object.entries(req.headers)) {
      if (["host", "content-length", "connection", "transfer-encoding"].includes(name)) continue;
      headers[name] = Array.isArray(value) ? value[0] : value;
    }
    headers["content-type"] = headers["content-type"] || "application/json";
    try {
      const upstream = await fetch(BACKEND + req.url, {
        method: req.method,
        headers,
        body: ["GET", "HEAD"].includes(req.method) ? undefined : body || undefined,
      });
      const buf = Buffer.from(await upstream.arrayBuffer());
      const outHeaders = {};
      for (const h of ["content-type", "location", "access-control-allow-origin"]) {
        const v = upstream.headers.get(h);
        if (v) outHeaders[h] = v;
      }
      res.writeHead(upstream.status, outHeaders);
      res.end(buf);
    } catch (err) {
      res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ detail: "Backend no disponible: " + err.message }));
    }
  });
}

function handleStatic(req, res) {
  const parsed = new URL(req.url, "http://localhost");
  let filePath = decodeURIComponent(parsed.pathname);
  if (filePath === "/") filePath = "/index.html";
  const candidate = path.normalize(path.join(DIST, filePath));
  if (!candidate.startsWith(DIST + path.sep) && candidate !== DIST) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    sendFile(res, candidate);
    return;
  }
  // Fallback SPA: cualquier ruta que no exista sirve el index.html
  sendFile(res, path.join(DIST, "index.html"));
}

// Nuevos endpoints para la app autocontenida (actualizaciones, APK).
function handleAppRoutes(req, res) {
  const parsed = new URL(req.url, "http://localhost");
  if (parsed.pathname === "/app/version") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ version: PKG.version }));
    return true;
  }
  if (parsed.pathname === "/app.apk") {
    if (fs.existsSync(APK_PATH)) {
      sendFile(res, APK_PATH);
      return true;
    }
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("APK no disponible");
    return true;
  }
  return false;
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api")) {
    handleApi(req, res);
  } else if (handleAppRoutes(req, res)) {
    // manejado por los endpoints de la app
  } else {
    handleStatic(req, res);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Inventario Interno -> http://127.0.0.1:${PORT} (API proxied a ${BACKEND})`);
});
