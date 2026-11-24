from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth import encode_token, hash_password, verify_password
from app.db import get_session
from app.mailer import RESET_TTL_MINUTES, generate_reset_code, send_reset_email
from app.models import User
from app.utils import get_current_user

router = APIRouter()


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=6, max_length=200)


class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)


@router.post("/register")
def register(data: RegisterRequest, session: Session = Depends(get_session)):
    if session.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Nombre de usuario ya en uso")
    if session.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        role="user",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    token = encode_token({"user_id": user.id, "username": user.username, "role": user.role})
    return {"token": token, "user": UserOut.model_validate(user)}


@router.post("/login")
def login(data: LoginRequest, session: Session = Depends(get_session)):
    user = session.query(User).filter(or_(User.username == data.username, User.email == data.username)).first()
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    token = encode_token({"user_id": user.id, "username": user.username, "role": user.role})
    return {"token": token, "user": UserOut.model_validate(user)}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


class ForgotPasswordRequest(BaseModel):
    login: str = Field(min_length=3, max_length=200)


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=6, max_length=64)
    password: str = Field(min_length=6, max_length=200)


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, session: Session = Depends(get_session)):
    user = session.query(User).filter(
        or_(User.username == data.login, User.email == data.login, User.email == data.login.lower())
    ).first()
    if user is not None:
        code = generate_reset_code()
        user.password_reset_token = code
        user.password_reset_expires_at = datetime.utcnow() + timedelta(minutes=RESET_TTL_MINUTES)
        session.commit()
        try:
            send_reset_email(user, code)
        except Exception:
            raise HTTPException(status_code=500, detail="No se pudo enviar el código de restablecimiento por email.")
    return {"ok": True, "message": "Si hay una cuenta con ese usuario o correo, se ha enviado un código a su email."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, session: Session = Depends(get_session)):
    user = session.query(User).filter(User.password_reset_token == data.token).first()
    if user is None or user.password_reset_expires_at is None or user.password_reset_expires_at <= datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Código inválido o vencido. Solicita uno nuevo desde la pantalla de inicio de sesión.",
        )
    user.password_hash = hash_password(data.password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    session.commit()
    return {"ok": True, "message": "Contraseña restablecida. Inicia sesión con tu nueva contraseña."}
