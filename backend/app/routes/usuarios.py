from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.database.models import Usuario
from app.schemas.usuario import UsuarioCriar, UsuarioAtualizar, UsuarioResposta
from app.services import usuario_service
from app.auth.dependencies import exigir_admin

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/", response_model=List[UsuarioResposta])
def listar(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    """Lista todos os usuarios cadastrados. Requer perfil admin."""
    return usuario_service.listar_usuarios(db)


@router.post("/", response_model=UsuarioResposta, status_code=201)
def criar(
    dados: UsuarioCriar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    """Cadastra um novo usuario. Requer perfil admin."""
    usuario_existente = usuario_service.buscar_usuario_por_email(db, dados.email)
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Ja existe um usuario com esse email.")
    return usuario_service.criar_usuario(db, dados)


@router.put("/{usuario_id}", response_model=UsuarioResposta)
def atualizar(
    usuario_id: int,
    dados: UsuarioAtualizar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    """Edita um usuario existente. Requer perfil admin."""
    usuario = usuario_service.atualizar_usuario(db, usuario_id, dados)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")
    return usuario


@router.delete("/{usuario_id}")
def excluir(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    """Exclui um usuario. Requer perfil admin."""
    if usuario_id == usuario_atual.id:
        raise HTTPException(status_code=400, detail="Voce nao pode excluir a si mesmo.")

    usuario = usuario_service.excluir_usuario(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")
    return {"mensagem": f"Usuario '{usuario.nome}' excluido com sucesso."}
