from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.database.models import Usuario
from app.schemas.exame import ExameCriar, ExameAtualizar, ExameResposta
from app.services import exame_service
from app.auth.dependencies import obter_usuario_atual, exigir_permissao

router = APIRouter(prefix="/exames", tags=["Exames"])


@router.get("/", response_model=List[ExameResposta])
def listar(
    skip: int = 0,
    limit: int = 3000,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual),
):
    """Lista todos os exames cadastrados (com paginacao). Requer login."""
    return exame_service.listar_exames(db, skip, limit)


@router.get("/pesquisar", response_model=List[ExameResposta])
def pesquisar(
    termo: str,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual),
):
    """Pesquisa exames por nome, sigla ou codigo. Requer login."""
    resultados = exame_service.pesquisar_exames(db, termo)
    if not resultados:
        raise HTTPException(
            status_code=404, detail="Nenhum exame encontrado para esse termo.")
    return resultados


@router.get("/{exame_id}", response_model=ExameResposta)
def buscar_por_id(
    exame_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual),
):
    """Busca um exame especifico pelo ID. Requer login."""
    exame = exame_service.buscar_exame_por_id(db, exame_id)
    if not exame:
        raise HTTPException(status_code=404, detail="Exame nao encontrado.")
    return exame


@router.post("/", response_model=ExameResposta, status_code=201)
def criar(
    dados: ExameCriar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_permissao("exames_gerenciar")),
):
    """Cadastra um novo exame. Requer permissao de gerenciamento de exames."""
    return exame_service.criar_exame(db, dados)


@router.put("/{exame_id}", response_model=ExameResposta)
def atualizar(
    exame_id: int,
    dados: ExameAtualizar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_permissao("exames_gerenciar")),
):
    """Edita um exame existente. Requer permissao de gerenciamento de exames."""
    exame = exame_service.atualizar_exame(db, exame_id, dados)
    if not exame:
        raise HTTPException(status_code=404, detail="Exame nao encontrado.")
    return exame


@router.delete("/{exame_id}")
def excluir(
    exame_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_permissao("exames_gerenciar")),
):
    """Exclui (inativa) um exame. Requer permissao de gerenciamento de exames."""
    exame = exame_service.excluir_exame(db, exame_id)
    if not exame:
        raise HTTPException(status_code=404, detail="Exame nao encontrado.")
    return {"mensagem": f"Exame '{exame.nome}' excluido com sucesso."}
