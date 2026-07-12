from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.usuario import UsuarioCriar, UsuarioResposta, LoginDados, TokenResposta
from app.services import usuario_service
from app.auth.jwt import criar_token_acesso

router = APIRouter(tags=["Autenticacao"])


@router.post("/cadastrar-usuario", response_model=UsuarioResposta, status_code=201)
def cadastrar_usuario(dados: UsuarioCriar, db: Session = Depends(get_db)):
    usuario_existente = usuario_service.buscar_usuario_por_email(db, dados.email)
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Ja existe um usuario com esse email.")

    if dados.perfil not in ("admin", "usuario"):
        raise HTTPException(status_code=400, detail="Perfil deve ser 'admin' ou 'usuario'.")

    return usuario_service.criar_usuario(db, dados)


@router.post("/login", response_model=TokenResposta)
def login(dados: LoginDados, db: Session = Depends(get_db)):
    usuario = usuario_service.autenticar_usuario(db, dados.email, dados.senha)
    if not usuario:
        raise HTTPException(status_code=401, detail="Email ou senha invalidos.")

    token = criar_token_acesso({"sub": usuario.email, "perfil": usuario.perfil})

    return TokenResposta(
        access_token=token,
        usuario=usuario,
    )