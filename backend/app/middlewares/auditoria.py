import logging

from fastapi import Request

from app.auth.jwt import decodificar_token

logger = logging.getLogger("nexlab.auditoria")

CAMINHOS_AUDITADOS = ("/pacientes", "/amostras", "/usuarios", "/portal")


def caminho_deve_ser_auditado(metodo: str, caminho: str) -> bool:
    return metodo != "OPTIONS" and caminho.startswith(CAMINHOS_AUDITADOS)


async def middleware_auditoria(request: Request, call_next):
    """
    Registra no log da aplicacao quem acessou ou alterou dados sensiveis
    (pacientes, amostras/resultados, usuarios, portal do paciente) --
    trilha de acesso pensada para a LGPD.

    Escreve so no logger (nao no banco): abrir uma sessao de banco extra
    a cada requisicao -- em cima da sessao que a propria rota ja usa --
    dobra o consumo de conexoes exatamente nessas rotas, e um banco com
    limite baixo de conexoes simultaneas (comum em plano gratuito) passa
    a recusar conexao para todo mundo. Nunca impede a resposta de voltar
    ao cliente.
    """
    resposta = await call_next(request)

    if caminho_deve_ser_auditado(request.method, request.url.path):
        _registrar(request, resposta.status_code)

    return resposta


def _registrar(request: Request, status_code: int) -> None:
    try:
        usuario_email = _identificar_usuario(request)
        logger.info(
            "auditoria usuario=%s metodo=%s caminho=%s status=%s ip=%s",
            usuario_email or "nao_autenticado",
            request.method,
            request.url.path,
            status_code,
            request.client.host if request.client else None,
        )
    except Exception:
        logger.exception("Falha ao registrar log de auditoria para %s %s", request.method, request.url.path)


def _identificar_usuario(request: Request):
    autorizacao = request.headers.get("authorization", "")
    if not autorizacao.lower().startswith("bearer "):
        return None

    payload = decodificar_token(autorizacao[7:])
    return payload.get("sub") if payload else None
