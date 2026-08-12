from datetime import date, datetime, timedelta, timezone

from app.database.models import Paciente, Exame, Solicitacao, Usuario
from app.auth.jwt import criptografar_senha
from app.services.paciente_service import FUSO_BRASIL


def _hoje_brasil():
    """
    O relatorio agrupa por dia no horario de Brasilia (FUSO_BRASIL), nao
    UTC -- entao "hoje" no teste tem que usar o mesmo fuso, senao o teste
    fica flakey na janela em que UTC ja virou o dia mas Brasilia nao.
    """
    return datetime.now(FUSO_BRASIL).date().isoformat()


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
    hoje = _hoje_brasil()

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

    hoje = _hoje_brasil()
    resposta_hoje = cliente.get(
        "/relatorios/atendimentos",
        params={"data": hoje},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta_hoje.json() == []

    resposta_dia_certo = cliente.get(
        "/relatorios/atendimentos",
        params={"data": ha_dez_dias.astimezone(FUSO_BRASIL).date().isoformat()},
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
        params={"data": _hoje_brasil()},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resposta.status_code == 403


def test_auditoria_loga_acesso_a_rota_sensivel(cliente, token_admin, caplog):
    """
    O middleware de auditoria registra no log da aplicacao (o logger
    "nexlab.auditoria") toda requisicao a rotas de dados sensiveis
    (pacientes, amostras, usuarios, portal), identificando o usuario
    pelo token.

    Isso NAO grava mais em log_auditoria: abrir uma sessao de banco
    extra a cada requisicao -- em cima da sessao que a propria rota ja
    usa -- dobrava o consumo de conexoes exatamente nessas rotas, e
    esgotava o limite de conexoes simultaneas do banco em producao,
    derrubando pacientes/amostras/liberacao para todo mundo. Ver
    app/middlewares/auditoria.py.
    """
    with caplog.at_level("INFO", logger="nexlab.auditoria"):
        resposta = cliente.get("/pacientes/", headers={"Authorization": f"Bearer {token_admin}"})
    assert resposta.status_code == 200

    mensagens = [r.message for r in caplog.records if r.name == "nexlab.auditoria"]
    assert any("admin@teste.com" in m and "/pacientes/" in m for m in mensagens)


def test_auditoria_nao_loga_rota_fora_do_escopo_sensivel(cliente, token_admin, caplog):
    with caplog.at_level("INFO", logger="nexlab.auditoria"):
        cliente.get("/exames/", headers={"Authorization": f"Bearer {token_admin}"})

    mensagens = [r.message for r in caplog.records if r.name == "nexlab.auditoria"]
    assert not any("/exames/" in m for m in mensagens)


def test_relatorio_auditoria_requer_admin(cliente, sessao_db):
    recepcao = Usuario(
        nome="Recepcao Auditoria",
        email="recepcao-auditoria@teste.com",
        senha_hash=criptografar_senha("senha-123456"),
        perfil="recepcao",
        permissoes=["pacientes_gerenciar"],
        ativo=True,
    )
    sessao_db.add(recepcao)
    sessao_db.commit()

    login = cliente.post("/login", json={"email": "recepcao-auditoria@teste.com", "senha": "senha-123456"})
    token = login.json()["access_token"]

    resposta = cliente.get(
        "/relatorios/auditoria",
        params={"data": _hoje_brasil()},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resposta.status_code == 403
