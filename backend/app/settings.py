import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "inventory.db"
SECRET_PATH = BASE_DIR / "data" / "secret.txt"


def _load_or_create_secret() -> str:
    SECRET_PATH.parent.mkdir(parents=True, exist_ok=True)
    if SECRET_PATH.exists():
        return SECRET_PATH.read_text(encoding="utf-8").strip()
    secret = os.urandom(32).hex()
    SECRET_PATH.write_text(secret, encoding="utf-8")
    return secret


SECRET_KEY = os.environ.get("APP_SECRET_KEY") or _load_or_create_secret()

# Configuración SMTP para enviar códigos de restablecimiento de contraseña
# (Gmail: usa una "App password" de tu cuenta de Google).
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_FROM = os.environ.get("SMTP_FROM") or None
SMTP_USER = os.environ.get("SMTP_USER") or None
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD") or None
