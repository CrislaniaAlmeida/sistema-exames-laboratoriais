from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Usuario
from app.schemas.usuario import UsuarioCriar, UsuarioResposta, LoginDados, TokenResposta
from app.services import usuario_service
from app.auth.jwt import criar_token_acesso
from app.auth.dependencies import exigir_admin

router = APIRouter(tags=["Autenticacao"])


@router.post("/cadastrar-usuario", response_model=UsuarioResposta, status_code=201)
def cadastrar_usuario(
    dados: UsuarioCriar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    """Cadastra um novo usuario. Requer perfil admin."""
    usuario_existente = usuario_service.buscar_usuario_por_email(db, dados.email)
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Ja existe um usuario com esse email.")

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