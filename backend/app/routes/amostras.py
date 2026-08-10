from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Usuario
from app.schemas.paciente import (
    AmostraConsultaResposta, AmostraResposta, AmostraStatusAtualizar,
    ItemExameResposta, ItemExameStatusAtualizar,
)
from app.services import paciente_service
from app.auth.dependencies import exigir_permissao, exigir_qualquer_permissao

router = APIRouter(prefix="/amostras", tags=["Amostras"])


@router.get("/painel", response_model=List[AmostraResposta])
def listar_painel_amostras(
    apenas_pendentes: bool = Query(True),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_qualquer_permissao("pacientes_gerenciar", "exames_gerenciar")),
):
    """
    Lista de trabalho com as amostras de todos os pacientes, para a
    equipe marcar coleta e liberacao de resultado sem precisar abrir
    o cadastro de cada paciente. Por padrao mostra so o que ainda esta
    pendente (nao coletado ou com algum exame aguardando resultado).
    """
    return paciente_service.listar_amostras_painel(db, apenas_pendentes)


@router.put("/{amostra_id}/status", response_model=AmostraResposta)
def atualizar_status_amostra(
    amostra_id: int,
    dados: AmostraStatusAtualizar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_qualquer_permissao("pacientes_gerenciar", "exames_gerenciar")),
):
    amostra = paciente_service.atualizar_status_amostra(db, amostra_id, dados.status)
    if not amostra:
        raise HTTPException(status_code=404, detail="Amostra nao encontrada.")
    return amostra


@router.put("/itens/{item_id}/status", response_model=ItemExameResposta)
def atualizar_status_resultado_item(
    item_id: int,
    dados: ItemExameStatusAtualizar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_qualquer_permissao("pacientes_gerenciar", "exames_gerenciar")),
):
    item = paciente_service.atualizar_status_resultado_item(db, item_id, dados.status_resultado)
    if not item:
        raise HTTPException(status_code=404, detail="Item de exame nao encontrado.")
    return item


@router.get("/{codigo}", response_model=AmostraConsultaResposta)
def consultar_amostra(
    codigo: str,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_permissao("pacientes_gerenciar")),
):
    """
    Consulta os dados de uma amostra (tubo) pelo codigo gerado no
    cadastro -- o mesmo codigo impresso no codigo de barras da
    etiqueta. Pensado para uma futura integracao com aparelho de
    setor: hoje nao ha nenhum aparelho conectado, mas essa rota ja
    deixa pronto o que ele precisaria consultar (dados do paciente e
    os exames daquele tubo).
    """
    amostra = paciente_service.buscar_amostra_por_codigo(db, codigo)
    if not amostra:
        raise HTTPException(status_code=404, detail="Amostra nao encontrada.")
    return amostra
