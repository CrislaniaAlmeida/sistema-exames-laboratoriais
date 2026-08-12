import logging

from fastapi import Request

from app.database.connection import get_db
from app.database.models import LogAuditoria, Usuario
from app.auth.jwt import decodificar_token

logger = logging.getLogger("nexlab.auditoria")

CAMINHOS_AUDITADOS = ("/pacientes", "/amostras", "/usuarios", "/portal")


def caminho_deve_ser_auditado(metodo: str, caminho: str) -> bool:
    return metodo != "OPTIONS" and caminho.startswith(CAMINHOS_AUDITADOS)


async def middleware_auditoria(request: Request, call_next):
    """
    Registra em log_auditoria quem acessou ou alterou dados sensiveis
    (pacientes, amostras/resultados, usuarios, portal do paciente) --
    trilha exigida pela LGPD. Roda depois da requisicao seguir seu
    curso normal e nunca impede a resposta de voltar ao cliente, mesmo
    que a gravacao do log falhe.
    """
    resposta = await call_next(request)

    if caminho_deve_ser_auditado(request.method, request.url.path):
        _registrar(request, resposta.status_code)

    return resposta


def _registrar(request: Request, status_code: int) -> None:
    # Usa a mesma fabrica de sessao que as rotas usam (respeitando o
    # dependency_override dos testes), em vez de abrir conexao direto
    # com o banco configurado no ambiente.
    fabrica_sessao = request.app.dependency_overrides.get(get_db, get_db)
    try:
        gerador = fabrica_sessao()
        db = next(gerador)
    except Exception:
        logger.exception("Falha ao abrir sessao para o log de auditoria")
        return

    try:
        usuario_id, usuario_nome = _identificar_usuario(db, request)
        db.add(LogAuditoria(
            usuario_id=usuario_id,
            usuario_nome=usuario_nome,
            metodo=request.method,
            caminho=request.url.path,
            status_code=status_code,
            ip=request.client.host if request.client else None,
        ))
        db.commit()
    except Exception:
        logger.exception("Falha ao gravar log de auditoria para %s %s", request.method, request.url.path)
    finally:
        gerador.close()


def _identificar_usuario(db, request: Request):
    autorizacao = request.headers.get("authorization", "")
    if not autorizacao.lower().startswith("bearer "):
        return None, None

    payload = decodificar_token(autorizacao[7:])
    email = payload.get("sub") if payload else None
    if not email:
        return None, None

    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    return (usuario.id, usuario.nome) if usuario else (None, None)
