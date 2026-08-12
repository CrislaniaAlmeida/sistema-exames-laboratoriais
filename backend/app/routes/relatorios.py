from datetime import date
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Usuario
from app.schemas.paciente import AtendimentoResposta, LogAuditoriaResposta
from app.services import paciente_service
from app.auth.dependencies import exigir_admin

router = APIRouter(prefix="/relatorios", tags=["Relatorios"])


@router.get("/atendimentos", response_model=List[AtendimentoResposta])
def relatorio_atendimentos_do_dia(
    data: date = Query(..., description="Data do relatorio (AAAA-MM-DD)"),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    """
    Lista todos os atendimentos (solicitacoes de exame) feitos numa
    determinada data, para o relatorio diario do administrador.
    """
    return paciente_service.listar_solicitacoes_do_dia(db, data)


@router.get("/auditoria", response_model=List[LogAuditoriaResposta])
def relatorio_auditoria_do_dia(
    data: date = Query(..., description="Data do relatorio (AAAA-MM-DD)"),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    """
    Lista a trilha de auditoria (quem acessou ou alterou dados de
    pacientes, amostras/resultados, usuarios e o portal do paciente)
    numa determinada data -- exigida pela LGPD.
    """
    return paciente_service.listar_log_auditoria_do_dia(db, data)
