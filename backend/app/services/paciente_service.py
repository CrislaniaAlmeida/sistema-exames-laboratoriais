from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.models import Paciente, Solicitacao, SolicitacaoExame, Amostra, Exame
from app.schemas.paciente import PacienteCriar, PacienteAtualizar
from app.validadores import validar_cpf

LIMITE_PAINEL_AMOSTRAS = 300

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

    if "cpf" in dados_para_atualizar and dados_para_atualizar["cpf"] != paciente.cpf:
        try:
            dados_para_atualizar["cpf"] = validar_cpf(dados_para_atualizar["cpf"])
        except ValueError as erro:
            raise HTTPException(status_code=400, detail=str(erro))

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


def listar_solicitacoes(db: Session, paciente_id: int):
    return (
        db.query(Solicitacao)
        .filter(Solicitacao.paciente_id == paciente_id)
        .order_by(Solicitacao.data_solicitacao.desc())
        .all()
    )


def gerar_codigo_amostra(db: Session) -> str:
    """Gera um codigo unico e sequencial para a amostra (ex: AMO-000001)."""
    ultimo_codigo = db.query(func.max(Amostra.codigo)).scalar()
    ultimo_numero = 0
    if ultimo_codigo:
        try:
            ultimo_numero = int(ultimo_codigo.split("-")[-1])
        except ValueError:
            ultimo_numero = 0
    return f"AMO-{ultimo_numero + 1:06d}"


def _chave_grupo_amostra(exame: Exame) -> str:
    if exame.tubo_cor:
        return f"tubo:{exame.tubo_cor.lower()}"
    return f"setor:{(exame.setor_responsavel or 'geral').lower()}"


def criar_solicitacao(db: Session, paciente_id: int, exame_ids: list):
    paciente = buscar_paciente_por_id(db, paciente_id)
    if not paciente:
        return None

    if not exame_ids:
        raise HTTPException(status_code=400, detail="Selecione ao menos um exame.")

    exames = db.query(Exame).filter(Exame.id.in_(exame_ids)).all()
    ids_validos = {e.id for e in exames}
    ids_invalidos = set(exame_ids) - ids_validos
    if ids_invalidos:
        raise HTTPException(
            status_code=400,
            detail=f"Exame(s) nao encontrado(s): {', '.join(str(i) for i in ids_invalidos)}",
        )

    nova_solicitacao = Solicitacao(paciente_id=paciente_id)
    db.add(nova_solicitacao)
    db.flush()

    # Agrupa os exames por tubo (ou por setor, quando o exame ainda nao
    # tem tubo cadastrado) -- cada grupo vira uma "amostra" com codigo
    # proprio, pronta para virar codigo de barras no futuro.
    grupos = {}
    for exame in exames:
        grupo = grupos.setdefault(_chave_grupo_amostra(exame), {
            "tubo_cor": exame.tubo_cor,
            "material": exame.material_nome,
            "setor": exame.setor_responsavel,
            "exame_ids": [],
        })
        grupo["exame_ids"].append(exame.id)
        if not grupo["material"] and exame.material_nome:
            grupo["material"] = exame.material_nome

    for grupo in grupos.values():
        amostra = Amostra(
            codigo=gerar_codigo_amostra(db),
            solicitacao_id=nova_solicitacao.id,
            tubo_cor=grupo["tubo_cor"],
            material=grupo["material"],
            setor=grupo["setor"],
        )
        db.add(amostra)
        db.flush()

        for exame_id in grupo["exame_ids"]:
            db.add(SolicitacaoExame(
                solicitacao_id=nova_solicitacao.id,
                exame_id=exame_id,
                amostra_id=amostra.id,
            ))

    db.commit()
    db.refresh(nova_solicitacao)
    return nova_solicitacao


def buscar_amostra_por_codigo(db: Session, codigo: str):
    return db.query(Amostra).filter(Amostra.codigo == codigo).first()


def listar_amostras_painel(db: Session, apenas_pendentes: bool = True):
    """
    Lista amostras para o painel de coleta/resultado, mais recentes
    primeiro. Uma amostra "pendente" e' aquela que ainda nao foi
    coletada, ou que tem algum exame ainda aguardando resultado.
    """
    consulta = db.query(Amostra)

    if apenas_pendentes:
        consulta = consulta.filter(
            (Amostra.status == "aguardando_coleta")
            | Amostra.itens.any(SolicitacaoExame.status_resultado == "aguardando_resultado")
        )

    return (
        consulta.order_by(Amostra.criado_em.desc())
        .limit(LIMITE_PAINEL_AMOSTRAS)
        .all()
    )


def buscar_amostra_por_id(db: Session, amostra_id: int):
    return db.query(Amostra).filter(Amostra.id == amostra_id).first()


def atualizar_status_amostra(db: Session, amostra_id: int, status: str):
    amostra = buscar_amostra_por_id(db, amostra_id)
    if not amostra:
        return None

    amostra.status = status
    amostra.coletado_em = datetime.now(timezone.utc) if status == "coletado" else None

    db.commit()
    db.refresh(amostra)
    return amostra


def buscar_item_exame_por_id(db: Session, item_id: int):
    return db.query(SolicitacaoExame).filter(SolicitacaoExame.id == item_id).first()


def atualizar_status_resultado_item(db: Session, item_id: int, status_resultado: str):
    item = buscar_item_exame_por_id(db, item_id)
    if not item:
        return None

    item.status_resultado = status_resultado
    item.resultado_disponivel_em = datetime.now(timezone.utc) if status_resultado == "disponivel" else None

    db.commit()
    db.refresh(item)
    return item
