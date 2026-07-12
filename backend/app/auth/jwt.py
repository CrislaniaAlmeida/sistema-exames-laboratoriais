import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITMO = "HS256"
MINUTOS_EXPIRACAO_TOKEN = 60 * 8

contexto_senha = CryptContext(schemes=["bcrypt"], deprecated="auto")


def criptografar_senha(senha: str) -> str:
    return contexto_senha.hash(senha)


def verificar_senha(senha_texto_puro: str, senha_hash: str) -> bool:
    return contexto_senha.verify(senha_texto_puro, senha_hash)


def criar_token_acesso(dados: dict) -> str:
    dados_para_codificar = dados.copy()
    expiracao = datetime.now(timezone.utc) + \
        timedelta(minutes=MINUTOS_EXPIRACAO_TOKEN)
    dados_para_codificar.update({"exp": expiracao})
    token = jwt.encode(dados_para_codificar, SECRET_KEY, algorithm=ALGORITMO)
    return token


def decodificar_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITMO])
        return payload
    except JWTError:
        return None
