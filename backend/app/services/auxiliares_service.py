import base64
import os
import re
import time

import httpx
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.database.models import Laboratorio, Material, Tubo
from app.schemas.auxiliares import (
    LaboratorioCriar, LaboratorioAtualizar,
    MaterialCriar,
    TuboCriar, TuboAtualizar,
)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO = os.getenv("GITHUB_REPO", "CrislaniaAlmeida/sistema-exames-laboratoriais")
GITHUB_BRANCH = os.getenv("GITHUB_BRANCH", "main")

EXTENSOES_PERMITIDAS = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024


# ---------- Laboratório ----------

def listar_laboratorios(db: Session):
    return db.query(Laboratorio).all()


def buscar_laboratorio_por_id(db: Session, laboratorio_id: int):
    return db.query(Laboratorio).filter(Laboratorio.id == laboratorio_id).first()


def criar_laboratorio(db: Session, dados: LaboratorioCriar):
    novo = Laboratorio(**dados.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


def atualizar_laboratorio(db: Session, laboratorio_id: int, dados: LaboratorioAtualizar):
    laboratorio = buscar_laboratorio_por_id(db, laboratorio_id)
    if not laboratorio:
        return None

    dados_para_atualizar = dados.model_dump(exclude_unset=True)
    for campo, valor in dados_para_atualizar.items():
        setattr(laboratorio, campo, valor)

    db.commit()
    db.refresh(laboratorio)
    return laboratorio


def excluir_laboratorio(db: Session, laboratorio_id: int):
    laboratorio = buscar_laboratorio_por_id(db, laboratorio_id)
    if not laboratorio:
        return None

    db.delete(laboratorio)
    db.commit()
    return laboratorio


# ---------- Material ----------

def listar_materiais(db: Session):
    return db.query(Material).all()


def criar_material(db: Session, dados: MaterialCriar):
    novo = Material(**dados.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


def excluir_material(db: Session, material_id: int):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        return None

    db.delete(material)
    db.commit()
    return material


# ---------- Tubo ----------

def listar_tubos(db: Session):
    return db.query(Tubo).all()


def buscar_tubo_por_id(db: Session, tubo_id: int):
    return db.query(Tubo).filter(Tubo.id == tubo_id).first()


def criar_tubo(db: Session, dados: TuboCriar):
    novo = Tubo(**dados.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


def atualizar_tubo(db: Session, tubo_id: int, dados: TuboAtualizar):
    tubo = buscar_tubo_por_id(db, tubo_id)
    if not tubo:
        return None

    dados_para_atualizar = dados.model_dump(exclude_unset=True)
    for campo, valor in dados_para_atualizar.items():
        setattr(tubo, campo, valor)

    db.commit()
    db.refresh(tubo)
    return tubo


def excluir_tubo(db: Session, tubo_id: int):
    tubo = buscar_tubo_por_id(db, tubo_id)
    if not tubo:
        return None

    db.delete(tubo)
    db.commit()
    return tubo


async def enviar_foto_tubo_para_github(arquivo: UploadFile) -> str:
    if not GITHUB_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="Upload de fotos nao configurado no servidor (GITHUB_TOKEN ausente).",
        )

    if arquivo.content_type not in EXTENSOES_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail="Formato de imagem nao suportado. Envie um arquivo JPG, PNG ou WEBP.",
        )

    conteudo = await arquivo.read()
    if len(conteudo) > TAMANHO_MAXIMO_BYTES:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Envie uma imagem de ate 5 MB.")

    extensao = EXTENSOES_PERMITIDAS[arquivo.content_type]
    nome_original = (arquivo.filename or "foto").rsplit(".", 1)[0].lower()
    nome_base = re.sub(r"[^a-z0-9-]+", "-", nome_original).strip("-") or "foto"
    nome_arquivo = f"{nome_base}-{int(time.time())}.{extensao}"
    caminho_repo = f"frontend/public/tubos/{nome_arquivo}"

    conteudo_base64 = base64.b64encode(conteudo).decode("utf-8")

    async with httpx.AsyncClient(timeout=20.0) as cliente:
        resposta = await cliente.put(
            f"https://api.github.com/repos/{GITHUB_REPO}/contents/{caminho_repo}",
            headers={
                "Authorization": f"Bearer {GITHUB_TOKEN}",
                "Accept": "application/vnd.github+json",
            },
            json={
                "message": f"Adiciona foto de tubo via upload: {nome_arquivo}",
                "content": conteudo_base64,
                "branch": GITHUB_BRANCH,
            },
        )

    if resposta.status_code not in (200, 201):
        raise HTTPException(
            status_code=502,
            detail="Nao foi possivel enviar a foto para o repositorio. Tente novamente.",
        )

    return f"/tubos/{nome_arquivo}"
