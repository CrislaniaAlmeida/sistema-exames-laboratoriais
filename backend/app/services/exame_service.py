from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.models import Exame
from app.schemas.exame import ExameCriar, ExameAtualizar


def listar_exames(db: Session, skip: int = 0, limit: int = 50):
    return (
        db.query(Exame)
        .filter(Exame.ativo == True)
        .offset(skip)
        .limit(limit)
        .all()
    )


def buscar_exame_por_id(db: Session, exame_id: int):
    return db.query(Exame).filter(Exame.id == exame_id, Exame.ativo == True).first()


def pesquisar_exames(db: Session, termo: str):
    """
    Pesquisa por nome, sigla ou codigo.
    """
    padrao = f"%{termo}%"
    return (
        db.query(Exame)
        .filter(
            Exame.ativo == True,
            or_(
                Exame.nome.ilike(padrao),
                Exame.sigla.ilike(padrao),
                Exame.codigo.ilike(padrao),
            ),
        )
        .all()
    )


def criar_exame(db: Session, dados: ExameCriar):
    novo_exame = Exame(**dados.model_dump())
    db.add(novo_exame)
    db.commit()
    db.refresh(novo_exame)
    return novo_exame


def atualizar_exame(db: Session, exame_id: int, dados: ExameAtualizar):
    exame = buscar_exame_por_id(db, exame_id)
    if not exame:
        return None

    dados_para_atualizar = dados.model_dump(exclude_unset=True)
    for campo, valor in dados_para_atualizar.items():
        setattr(exame, campo, valor)

    db.commit()
    db.refresh(exame)
    return exame


def excluir_exame(db: Session, exame_id: int):
    """
    Exclusao logica: em vez de apagar de verdade do banco,
    marcamos como inativo.
    """
    exame = buscar_exame_por_id(db, exame_id)
    if not exame:
        return None

    exame.ativo = False
    db.commit()
    return exame
