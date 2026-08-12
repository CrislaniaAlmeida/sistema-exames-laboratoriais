import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.models import Paciente, Solicitacao, SolicitacaoExame, Amostra, Exame
from app.schemas.paciente import PacienteCriar, PacienteAtualizar
from app.validadores import validar_cpf
from app.services.email_service import enviar_email_resultado_disponivel

LIMITE_PAINEL_AMOSTRAS = 300

FUSO_BRASIL = timezone(timedelta(hours=-3))


def _data_local_brasil(momento):
    """Converte um datetime (com ou sem timezone) para a data no horario de Brasilia."""
    if momento is None:
        return None
    if momento.tzinfo is None:
        momento = momento.replace(tzinfo=timezone.utc)
    return momento.astimezone(FUSO_BRASIL).date()

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


def listar_solicitacoes_do_dia(db: Session, data):
    """
    Lista os atendimentos (solicitacoes de exame) de todos os
    pacientes num determinado dia, no horario de Brasilia -- para o
    relatorio diario de atendimentos.

    Busca um intervalo generoso (1 dia de cada lado, em UTC) e depois
    confere a data exata em Python -- assim funciona igual em
    qualquer banco, sem depender de funcoes de fuso horario do SQL.
    """
    inicio_aproximado = datetime(data.year, data.month, data.day, tzinfo=timezone.utc) - timedelta(days=1)
    fim_aproximado = datetime(data.year, data.month, data.day, tzinfo=timezone.utc) + timedelta(days=2)

    candidatas = (
        db.query(Solicitacao)
        .filter(
            Solicitacao.data_solicitacao >= inicio_aproximado,
            Solicitacao.data_solicitacao <= fim_aproximado,
        )
        .order_by(Solicitacao.data_solicitacao)
        .all()
    )
    return [s for s in candidatas if _data_local_brasil(s.data_solicitacao) == data]


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

    nova_solicitacao = Solicitacao(paciente_id=paciente_id, token_publico=secrets.token_urlsafe(18))
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


def buscar_solicitacao_por_token(db: Session, token: str):
    """Busca uma solicitacao pelo token publico do portal do paciente (rota sem autenticacao)."""
    if not token:
        return None
    return db.query(Solicitacao).filter(Solicitacao.token_publico == token).first()


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


ORDEM_PRAZO_STATUS = {"atrasado": 0, "proximo_do_limite": 1, "no_prazo": 2, "sem_prazo": 3}


def listar_itens_liberacao(db: Session):
    """
    Itens de exame aguardando resultado, apenas dos exames realizados
    internamente (nao enviados a laboratorio de apoio) -- para a tela
    de Liberacao de Exames, organizada por setor. Ordenados pela
    urgencia do prazo (atrasados primeiro).
    """
    itens = (
        db.query(SolicitacaoExame)
        .join(Exame, SolicitacaoExame.exame_id == Exame.id)
        .filter(SolicitacaoExame.status_resultado.in_(["aguardando_resultado", "aguardando_confirmacao"]))
        .filter(Exame.laboratorio_id.is_(None))
        .all()
    )

    def chave_ordenacao(item):
        limite = item.prazo_limite
        return (
            ORDEM_PRAZO_STATUS.get(item.prazo_status, 9),
            limite or datetime.max.replace(tzinfo=timezone.utc),
        )

    return sorted(itens, key=chave_ordenacao)


def buscar_amostra_por_id(db: Session, amostra_id: int):
    return db.query(Amostra).filter(Amostra.id == amostra_id).first()


def atualizar_status_amostra(db: Session, amostra_id: int, status: str):
    amostra = buscar_amostra_por_id(db, amostra_id)
    if not amostra:
        return None

    amostra.status = status
    amostra.coletado_em = datetime.now(timezone.utc) if status == "coletado" else None

    if status == "coletado" and amostra.possui_exame_interno and amostra.recebido_em is None:
        amostra.recebido_em = amostra.coletado_em
    elif status == "aguardando_coleta":
        amostra.recebido_em = None

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
    if status_resultado == "disponivel":
        item.resultado_disponivel_em = datetime.now(timezone.utc)
    else:
        item.resultado_disponivel_em = None
        item.valor_resultado = None
        item.flag_resultado = None
        item.observacoes_resultado = None
        item.liberado_por_id = None
        item.lancado_por_id = None
        item.lancado_em = None

    db.commit()
    db.refresh(item)
    return item


def calcular_flag_resultado(valor_resultado: str, exame: Exame):
    """
    Compara o valor lancado com a faixa de referencia numerica do
    exame (quando configurada) e devolve 'H' (alto), 'L' (baixo) ou
    None (dentro da faixa, ou faixa/valor nao numericos -- nesses
    casos o bioquimico usa o texto de referencia para interpretar).
    """
    if exame is None:
        return None
    try:
        valor_numerico = float(str(valor_resultado).replace(",", "."))
    except ValueError:
        return None

    if exame.valor_referencia_max is not None and valor_numerico > exame.valor_referencia_max:
        return "H"
    if exame.valor_referencia_min is not None and valor_numerico < exame.valor_referencia_min:
        return "L"
    return None


def lancar_resultado(db: Session, item_id: int, valor_resultado: str, observacoes_resultado: str, usuario_atual):
    """
    Primeira etapa do lancamento: registra o valor digitado e deixa o
    item aguardando confirmacao. Ainda nao libera o resultado -- isso
    so acontece em confirmar_liberacao_resultado, mesmo que seja a
    mesma pessoa a confirmar.
    """
    item = buscar_item_exame_por_id(db, item_id)
    if not item:
        return None

    item.valor_resultado = valor_resultado
    item.unidade_resultado = item.exame.unidade_resultado if item.exame else None
    item.flag_resultado = calcular_flag_resultado(valor_resultado, item.exame)
    item.observacoes_resultado = observacoes_resultado
    item.status_resultado = "aguardando_confirmacao"
    item.lancado_por_id = usuario_atual.id
    item.lancado_em = datetime.now(timezone.utc)
    item.resultado_disponivel_em = None
    item.liberado_por_id = None

    db.commit()
    db.refresh(item)
    return item


def confirmar_liberacao_resultado(db: Session, item_id: int, usuario_atual):
    """
    Segunda etapa: confirma o valor ja lancado e libera o resultado
    para o paciente/medico verem. Pode ser confirmado pela mesma
    pessoa que lancou.
    """
    item = buscar_item_exame_por_id(db, item_id)
    if not item:
        return None
    if item.status_resultado != "aguardando_confirmacao":
        raise HTTPException(
            status_code=400,
            detail="Este item nao esta aguardando confirmacao.",
        )

    item.status_resultado = "disponivel"
    item.resultado_disponivel_em = datetime.now(timezone.utc)
    item.liberado_por_id = usuario_atual.id

    db.commit()
    db.refresh(item)

    enviar_email_resultado_disponivel(item)

    return item
