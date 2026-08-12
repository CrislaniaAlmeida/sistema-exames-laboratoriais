from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.database.models import Usuario
from app.schemas.paciente import (
    PacienteCriar, PacienteAtualizar, PacienteResposta,
    SolicitacaoCriar, SolicitacaoResposta,
)
from app.services import paciente_service
from app.auth.dependencies import exigir_permissao

router = APIRouter(prefix="/pacientes", tags=["Pacientes"])


@router.get("/", response_model=List[PacienteResposta])
def listar(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_permissao("pacientes_gerenciar")),
):
    return paciente_service.listar_pacientes(db)


@router.get("/{paciente_id}", response_model=PacienteResposta)
def buscar_por_id(
    paciente_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_permissao("pacientes_gerenciar")),
):
    paciente = paciente_service.buscar_paciente_por_id(db, paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente nao encontrado.")
    return paciente


@router.post("/", response_model=PacienteResposta, status_code=201)
def criar(
    dados: PacienteCriar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_permissao("pacientes_gerenciar")),
):
    return paciente_service.criar_paciente(db, dados)


@router.put("/{paciente_id}", response_model=PacienteResposta)
def atualizar(
    paciente_id: int,
    dados: PacienteAtualizar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_permissao("pacientes_gerenciar")),
):
    paciente = paciente_service.atualizar_paciente(db, paciente_id, dados)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente nao encontrado.")
    return paciente


@router.delete("/{paciente_id}")
def excluir(
    paciente_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_permissao("pacientes_gerenciar")),
):
    paciente = paciente_service.excluir_paciente(db, paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente nao encontrado.")
    return {"mensagem": f"Paciente '{paciente.nome}' excluido com sucesso."}


@router.get("/{paciente_id}/solicitacoes", response_model=List[SolicitacaoResposta])
def listar_solicitacoes(
    paciente_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_permissao("pacientes_gerenciar")),
):
    return paciente_service.listar_solicitacoes(db, paciente_id)


@router.post("/{paciente_id}/solicitacoes", response_model=SolicitacaoResposta, status_code=201)
def criar_solicitacao(
    paciente_id: int,
    dados: SolicitacaoCriar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_permissao("pacientes_gerenciar")),
):
    solicitacao = paciente_service.criar_solicitacao(db, paciente_id, dados.exame_ids)
    if not solicitacao:
        raise HTTPException(status_code=404, detail="Paciente nao encontrado.")
    return solicitacao


@router.put("/{paciente_id}/solicitacoes/{solicitacao_id}/renovar-link", response_model=SolicitacaoResposta)
def renovar_link_portal(
    paciente_id: int,
    solicitacao_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_permissao("pacientes_gerenciar")),
):
    """
    Gera um novo link do portal para essa solicitacao, invalidando o
    anterior -- usado para renovar um link vencido ou para revogar um
    link ja compartilhado por engano.
    """
    solicitacao = paciente_service.renovar_link_portal(db, paciente_id, solicitacao_id)
    if not solicitacao:
        raise HTTPException(status_code=404, detail="Solicitacao nao encontrada.")
    return solicitacao
