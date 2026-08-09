from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.models import Paciente
from app.schemas.paciente import PacienteCriar, PacienteAtualizar

MAXIMO_MEDICAMENTOS = 6


def gerar_codigo_paciente(db: Session) -> str:
    """
    Gera um codigo unico e sequencial para o paciente (ex: PAC-000001).
    Nunca repete, mesmo se pacientes anteriores forem excluidos, porque
    sempre olha o maior numero ja usado.
    """
    ultimo_codigo = db.query(func.max(Paciente.codigo)).scalar()
    ultimo_numero = 0
    if ultimo_codigo:
        try:
            ultimo_numero = int(ultimo_codigo.split("-")[-1])
        except ValueError:
            ultimo_numero = 0
    return f"PAC-{ultimo_numero + 1:06d}"


def validar_medicamentos(medicamentos):
    if medicamentos and len(medicamentos) > MAXIMO_MEDICAMENTOS:
        raise HTTPException(
            status_code=400,
            detail=f"No maximo {MAXIMO_MEDICAMENTOS} medicamentos podem ser informados.",
        )
    return [m.strip() for m in (medicamentos or []) if m and m.strip()]


def listar_pacientes(db: Session):
    return db.query(Paciente).order_by(Paciente.criado_em.desc()).all()


def buscar_paciente_por_id(db: Session, paciente_id: int):
    return db.query(Paciente).filter(Paciente.id == paciente_id).first()


def buscar_paciente_por_cpf(db: Session, cpf: str):
    return db.query(Paciente).filter(Paciente.cpf == cpf).first()


def criar_paciente(db: Session, dados: PacienteCriar):
    if buscar_paciente_por_cpf(db, dados.cpf):
        raise HTTPException(status_code=400, detail="Ja existe um paciente cadastrado com esse CPF.")

    dados_dict = dados.model_dump()
    dados_dict["medicamentos"] = validar_medicamentos(dados_dict.get("medicamentos"))
    dados_dict["codigo"] = gerar_codigo_paciente(db)

    novo_paciente = Paciente(**dados_dict)
    db.add(novo_paciente)
    db.commit()
    db.refresh(novo_paciente)
    return novo_paciente


def atualizar_paciente(db: Session, paciente_id: int, dados: PacienteAtualizar):
    paciente = buscar_paciente_por_id(db, paciente_id)
    if not paciente:
        return None

    dados_para_atualizar = dados.model_dump(exclude_unset=True)

    if "cpf" in dados_para_atualizar:
        outro = buscar_paciente_por_cpf(db, dados_para_atualizar["cpf"])
        if outro and outro.id != paciente_id:
            raise HTTPException(status_code=400, detail="Ja existe um paciente cadastrado com esse CPF.")

    if "medicamentos" in dados_para_atualizar:
        dados_para_atualizar["medicamentos"] = validar_medicamentos(dados_para_atualizar["medicamentos"])

    for campo, valor in dados_para_atualizar.items():
        setattr(paciente, campo, valor)

    db.commit()
    db.refresh(paciente)
    return paciente


def excluir_paciente(db: Session, paciente_id: int):
    paciente = buscar_paciente_por_id(db, paciente_id)
    if not paciente:
        return None

    db.delete(paciente)
    db.commit()
    return paciente
