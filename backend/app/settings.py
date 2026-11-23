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
