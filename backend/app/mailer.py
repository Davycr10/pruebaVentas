"""Envío de códigos de restablecimiento de contraseña por email (SMTP, Gmail)."""

import secrets
import smtplib
from email.message import EmailMessage

from app.settings import SMTP_FROM, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER

RESET_CODE_LENGTH = 6
RESET_TTL_MINUTES = 10


def generate_reset_code() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(RESET_CODE_LENGTH))


def send_reset_email(user, code: str) -> None:
    if not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError("El servidor de correo (SMTP) no está configurado (SMTP_USER / SMTP_PASSWORD)")
    msg = EmailMessage()
    msg["From"] = SMTP_FROM or SMTP_USER
    msg["To"] = user.email
    msg["Subject"] = "Código para restablecer tu contraseña - Inventario Interno"
    msg.set_content(
        f"Hola {user.username},\n\n"
        "Alguien (probablemente tú) pidió restablecer tu contraseña.\n\n"
        f"Tu código de restablecimiento es: {code}\n\n"
        f"Este código es válido por {RESET_TTL_MINUTES} minutos.\n"
        "Si no pediste esto, ignora este correo."
    )
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
