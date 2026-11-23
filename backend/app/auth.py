import base64
import hashlib
import hmac
import json
import os
import time

from app.settings import SECRET_KEY


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("utf-8")


def _b64d(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def encode_token(payload: dict, expires_in_seconds: int = 60 * 60 * 24 * 7) -> str:
    header = _b64e(json.dumps({"alg": "HS256", "typ": "JWT"}).encode("utf-8"))
    body = _b64e(
        json.dumps(
            {
                "iat": int(time.time()),
                "exp": int(time.time()) + expires_in_seconds,
                **payload,
            }
        ).encode("utf-8")
    )
    signature = _b64e(
        hmac.new(SECRET_KEY.encode("utf-8"), f"{header}.{body}".encode("utf-8"), hashlib.sha256).digest()
    )
    return f"{header}.{body}.{signature}"


def decode_token(token: str) -> dict | None:
    try:
        header, body, signature = token.split(".")
        expected = _b64e(
            hmac.new(SECRET_KEY.encode("utf-8"), f"{header}.{body}".encode("utf-8"), hashlib.sha256).digest()
        )
        if not hmac.compare_digest(signature, expected):
            return None
        data = json.loads(_b64d(body))
        if data.get("exp", 0) < time.time():
            return None
        return data
    except Exception:
        return None


def hash_password(password: str) -> str:
    salt = os.urandom(8).hex()
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"pbkdf2${salt}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        _, salt, digest = password_hash.split("$")
        computed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
        return hmac.compare_digest(computed.hex(), digest)
    except Exception:
        return False
