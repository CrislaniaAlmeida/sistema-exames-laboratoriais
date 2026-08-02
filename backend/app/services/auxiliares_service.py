from sqlalchemy.orm import Session
from app.database.models import Laboratorio, Material, Tubo
from app.schemas.auxiliares import (
    LaboratorioCriar, LaboratorioAtualizar,
    MaterialCriar,
    TuboCriar, TuboAtualizar,
)


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
