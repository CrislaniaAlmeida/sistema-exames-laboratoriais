from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.paciente import PortalResposta
from app.services import paciente_service
from app.limiter import limiter

router = APIRouter(prefix="/portal", tags=["Portal do Paciente"])


@router.get("/{token}", response_model=PortalResposta)
@limiter.limit("30/minute")
def consultar_portal_paciente(request: Request, token: str, db: Session = Depends(get_db)):
    """
    Rota publica (sem login) do portal do paciente -- acessada pelo
    link unico enviado por e-mail ou WhatsApp quando um resultado
    fica disponivel. O token e' longo e aleatorio, gerado uma vez por
    solicitacao de exames, e funciona como a credencial de acesso.
    """
    solicitacao = paciente_service.buscar_solicitacao_por_token(db, token)
    if not solicitacao or not solicitacao.paciente or solicitacao.token_expirado:
        raise HTTPException(status_code=404, detail="Link invalido ou expirado.")

    return {"paciente": solicitacao.paciente, "solicitacao": solicitacao}
