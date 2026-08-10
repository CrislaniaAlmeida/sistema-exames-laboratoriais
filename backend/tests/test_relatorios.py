from datetime import date, datetime, timedelta, timezone

from app.database.models import Paciente, Exame, Solicitacao, Usuario
from app.auth.jwt import criptografar_senha


def _criar_paciente_com_exame(sessao_db, cliente, token_admin, codigo="PAC-000300"):
    paciente = Paciente(
        codigo=codigo,
        nome="Paciente Relatorio",
        cpf="11144477735",
        data_nascimento=date(1990, 1, 1),
        convenio="Unimed",
    )
    exame = Exame(nome="Glicose", sigla="GLI", setor_responsavel="Bioquimica")
    sessao_db.add_all([paciente, exame])
    sessao_db.commit()

    resposta = cliente.post(
        f"/pacientes/{paciente.id}/solicitacoes",
        json={"exame_ids": [exame.id]},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 201, resposta.text
    return paciente


def test_relatorio_lista_atendimento_de_hoje(cliente, token_admin, sessao_db):
    paciente = _criar_paciente_com_exame(sessao_db, cliente, token_admin)
    hoje = date.today().isoformat()

    resposta = cliente.get(
        "/relatorios/atendimentos",
        params={"data": hoje},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 200, resposta.text
    dados = resposta.json()
    assert len(dados) == 1
    assert dados[0]["paciente"]["codigo"] == paciente.codigo
    assert dados[0]["paciente"]["convenio"] == "Unimed"
    assert dados[0]["exames"][0]["sigla"] == "GLI"


def test_relatorio_nao_lista_atendimento_de_outro_dia(cliente, token_admin, sessao_db):
    paciente = Paciente(
        codigo="PAC-000301",
        nome="Paciente Antigo",
        cpf="11144477735",
        data_nascimento=date(1990, 1, 1),
    )
    sessao_db.add(paciente)
    sessao_db.commit()

    ha_dez_dias = datetime.now(timezone.utc) - timedelta(days=10)
    solicitacao_antiga = Solicitacao(paciente_id=paciente.id, data_solicitacao=ha_dez_dias)
    sessao_db.add(solicitacao_antiga)
    sessao_db.commit()

    hoje = date.today().isoformat()
    resposta_hoje = cliente.get(
        "/relatorios/atendimentos",
        params={"data": hoje},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta_hoje.json() == []

    resposta_dia_certo = cliente.get(
        "/relatorios/atendimentos",
        params={"data": ha_dez_dias.date().isoformat()},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert len(resposta_dia_certo.json()) == 1


def test_relatorio_requer_admin(cliente, sessao_db):
    recepcao = Usuario(
        nome="Recepcao",
        email="recepcao-relatorio@teste.com",
        senha_hash=criptografar_senha("senha-123456"),
        perfil="recepcao",
        permissoes=["pacientes_gerenciar"],
        ativo=True,
    )
    sessao_db.add(recepcao)
    sessao_db.commit()

    login = cliente.post("/login", json={"email": "recepcao-relatorio@teste.com", "senha": "senha-123456"})
    token = login.json()["access_token"]

    resposta = cliente.get(
        "/relatorios/atendimentos",
        params={"data": date.today().isoformat()},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resposta.status_code == 403
