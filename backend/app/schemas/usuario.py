from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UsuarioCriar(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    perfil: str = "usuario"


class UsuarioResposta(BaseModel):
    id: int
    nome: str
    email: EmailStr
    perfil: str
    ativo: bool
    criado_em: datetime

    class Config:
        from_attributes = True


class LoginDados(BaseModel):
    email: EmailStr
    senha: str


class TokenResposta(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioResposta
