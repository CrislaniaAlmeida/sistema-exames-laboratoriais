from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Usuario
from app.auth.jwt import decodificar_token

# Isso faz o Swagger pedir apenas para colar o token (Bearer), sem formulario de login
esquema_bearer = HTTPBearer()


def obter_usuario_atual(
    credenciais: HTTPAuthorizationCredentials = Depends(esquema_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Le o token enviado pelo usuario, verifica se e valido,
    e retorna o usuario correspondente do banco de dados.
    """
    excecao_nao_autorizado = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nao foi possivel validar as credenciais.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credenciais.credentials
    payload = decodificar_token(token)
    if payload is None:
        raise excecao_nao_autorizado

    email = payload.get("sub")
    if email is None:
        raise excecao_nao_autorizado

    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if usuario is None or not usuario.ativo:
        raise excecao_nao_autorizado

    return usuario


def exigir_admin(usuario_atual: Usuario = Depends(obter_usuario_atual)) -> Usuario:
    """
    Alem de exigir login, verifica se o usuario tem perfil 'admin'.
    """
    if usuario_atual.perfil != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem realizar esta acao.",
        )
    return usuario_atual


def exigir_permissao(chave_permissao: str):
    """
    Gera uma dependencia que libera o acesso para administradores
    (que tem acesso total) ou para usuarios que tenham a permissao
    especifica cadastrada.
    """
    def verificar(usuario_atual: Usuario = Depends(obter_usuario_atual)) -> Usuario:
        if usuario_atual.perfil == "admin":
            return usuario_atual
        if chave_permissao in (usuario_atual.permissoes or []):
            return usuario_atual
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voce nao tem permissao para realizar esta acao.",
        )
    return verificar


def exigir_qualquer_permissao(*chaves_permissao: str):
    """
    Como exigir_permissao, mas libera o acesso se o usuario tiver
    QUALQUER UMA das permissoes informadas -- util para telas que
    varios cargos diferentes precisam acessar (ex: painel de amostras,
    usado tanto por quem coleta quanto por quem libera resultado).
    """
    def verificar(usuario_atual: Usuario = Depends(obter_usuario_atual)) -> Usuario:
        if usuario_atual.perfil == "admin":
            return usuario_atual
        permissoes_usuario = usuario_atual.permissoes or []
        if any(chave in permissoes_usuario for chave in chaves_permissao):
            return usuario_atual
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voce nao tem permissao para realizar esta acao.",
        )
    return verificar
