from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Usuario
from app.schemas.usuario import (
    UsuarioCriar, UsuarioResposta, LoginDados, TokenResposta, TrocarSenhaDados,
)
from app.services import usuario_service
from app.auth.jwt import criar_token_acesso
from app.auth.dependencies import exigir_admin, obter_usuario_atual
from app.limiter import limiter

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
@limiter.limit("5/minute")
def login(request: Request, dados: LoginDados, db: Session = Depends(get_db)):
    usuario = usuario_service.autenticar_usuario(db, dados.email, dados.senha)
    if not usuario:
        raise HTTPException(status_code=401, detail="Email ou senha invalidos.")

    token = criar_token_acesso({"sub": usuario.email, "perfil": usuario.perfil})

    return TokenResposta(
        access_token=token,
        usuario=usuario,
    )


@router.put("/trocar-senha", response_model=UsuarioResposta)
def trocar_senha(
    dados: TrocarSenhaDados,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual),
):
    """Permite que o proprio usuario logado defina uma nova senha."""
    return usuario_service.trocar_senha_propria(db, usuario_atual, dados.senha_nova)