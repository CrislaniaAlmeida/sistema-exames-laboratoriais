from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.database.models import Usuario
from app.schemas.auxiliares import (
    LaboratorioCriar, LaboratorioAtualizar, LaboratorioResposta,
    MaterialCriar, MaterialResposta,
    TuboCriar, TuboAtualizar, TuboResposta,
)
from app.services import auxiliares_service
from app.auth.dependencies import obter_usuario_atual, exigir_admin

router = APIRouter(tags=["Dados Auxiliares"])


# ---------- Laboratorio ----------

@router.get("/laboratorios/", response_model=List[LaboratorioResposta])
def listar_laboratorios(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual),
):
    return auxiliares_service.listar_laboratorios(db)


@router.post("/laboratorios/", response_model=LaboratorioResposta, status_code=201)
def criar_laboratorio(
    dados: LaboratorioCriar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    return auxiliares_service.criar_laboratorio(db, dados)


@router.put("/laboratorios/{laboratorio_id}", response_model=LaboratorioResposta)
def atualizar_laboratorio(
    laboratorio_id: int,
    dados: LaboratorioAtualizar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    laboratorio = auxiliares_service.atualizar_laboratorio(
        db, laboratorio_id, dados)
    if not laboratorio:
        raise HTTPException(
            status_code=404, detail="Laboratorio nao encontrado.")
    return laboratorio


@router.delete("/laboratorios/{laboratorio_id}")
def excluir_laboratorio(
    laboratorio_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    laboratorio = auxiliares_service.excluir_laboratorio(db, laboratorio_id)
    if not laboratorio:
        raise HTTPException(
            status_code=404, detail="Laboratorio nao encontrado.")
    return {"mensagem": f"Laboratorio '{laboratorio.nome}' excluido com sucesso."}


# ---------- Material ----------

@router.get("/materiais/", response_model=List[MaterialResposta])
def listar_materiais(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual),
):
    return auxiliares_service.listar_materiais(db)


@router.post("/materiais/", response_model=MaterialResposta, status_code=201)
def criar_material(
    dados: MaterialCriar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    return auxiliares_service.criar_material(db, dados)


@router.delete("/materiais/{material_id}")
def excluir_material(
    material_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    material = auxiliares_service.excluir_material(db, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material nao encontrado.")
    return {"mensagem": f"Material '{material.nome}' excluido com sucesso."}


# ---------- Tubo ----------

@router.get("/tubos/", response_model=List[TuboResposta])
def listar_tubos(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual),
):
    return auxiliares_service.listar_tubos(db)


@router.post("/tubos/", response_model=TuboResposta, status_code=201)
def criar_tubo(
    dados: TuboCriar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    return auxiliares_service.criar_tubo(db, dados)


@router.post("/tubos/upload-foto")
async def upload_foto_tubo(
    arquivo: UploadFile = File(...),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    foto_url = await auxiliares_service.enviar_foto_tubo_para_github(arquivo)
    return {"foto_url": foto_url}


@router.put("/tubos/{tubo_id}", response_model=TuboResposta)
def atualizar_tubo(
    tubo_id: int,
    dados: TuboAtualizar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    tubo = auxiliares_service.atualizar_tubo(db, tubo_id, dados)
    if not tubo:
        raise HTTPException(status_code=404, detail="Tubo nao encontrado.")
    return tubo


@router.delete("/tubos/{tubo_id}")
def excluir_tubo(
    tubo_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_admin),
):
    tubo = auxiliares_service.excluir_tubo(db, tubo_id)
    if not tubo:
        raise HTTPException(status_code=404, detail="Tubo nao encontrado.")
    return {"mensagem": f"Tubo '{tubo.cor}' excluido com sucesso."}
