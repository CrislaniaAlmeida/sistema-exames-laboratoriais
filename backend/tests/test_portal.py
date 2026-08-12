from datetime import date, datetime, timedelta, timezone

from app.database.models import Paciente, Exame, Solicitacao
from app.services import paciente_service


def _criar_paciente_com_exame(sessao_db, cliente, token_admin, email="paciente@teste.com"):
    paciente = Paciente(
        codigo="PAC-000300",
        nome="Paciente Portal",
        cpf="11144477735",
        data_nascimento=date(1990, 1, 1),
        email=email,
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
    return resposta.json()


def test_solicitacao_recebe_token_publico_ao_ser_criada(cliente, token_admin, sessao_db):
    solicitacao = _criar_paciente_com_exame(sessao_db, cliente, token_admin)
    assert solicitacao["token_publico"]
    assert len(solicitacao["token_publico"]) > 15


def test_portal_retorna_dados_sem_autenticacao(cliente, token_admin, sessao_db):
    solicitacao = _criar_paciente_com_exame(sessao_db, cliente, token_admin)
    token = solicitacao["token_publico"]

    resposta = cliente.get(f"/portal/{token}")
    assert resposta.status_code == 200, resposta.text
    dados = resposta.json()
    assert dados["paciente"]["nome"] == "Paciente Portal"
    assert dados["solicitacao"]["id"] == solicitacao["id"]
    assert len(dados["solicitacao"]["amostras"][0]["itens"]) == 1


def test_portal_token_invalido_retorna_404(cliente):
    resposta = cliente.get("/portal/token-que-nao-existe")
    assert resposta.status_code == 404


def test_solicitacao_recebe_expiracao_do_token(cliente, token_admin, sessao_db):
    solicitacao = _criar_paciente_com_exame(sessao_db, cliente, token_admin)
    assert solicitacao["token_publico_expira_em"]
    assert solicitacao["token_expirado"] is False


def test_portal_com_token_vencido_retorna_404(cliente, token_admin, sessao_db):
    solicitacao = _criar_paciente_com_exame(sessao_db, cliente, token_admin)
    token = solicitacao["token_publico"]

    registro = sessao_db.query(Solicitacao).filter(Solicitacao.id == solicitacao["id"]).first()
    registro.token_publico_expira_em = datetime.now(timezone.utc) - timedelta(days=1)
    sessao_db.commit()

    resposta = cliente.get(f"/portal/{token}")
    assert resposta.status_code == 404


def test_portal_com_token_sem_expiracao_definida_continua_valido(cliente, token_admin, sessao_db):
    """Links gerados antes desta funcionalidade (sem data de expiracao salva) nao devem parar de funcionar."""
    solicitacao = _criar_paciente_com_exame(sessao_db, cliente, token_admin)
    token = solicitacao["token_publico"]

    registro = sessao_db.query(Solicitacao).filter(Solicitacao.id == solicitacao["id"]).first()
    registro.token_publico_expira_em = None
    sessao_db.commit()

    resposta = cliente.get(f"/portal/{token}")
    assert resposta.status_code == 200


def test_renovar_link_gera_token_novo_e_invalida_o_antigo(cliente, token_admin, sessao_db):
    solicitacao = _criar_paciente_com_exame(sessao_db, cliente, token_admin)
    token_antigo = solicitacao["token_publico"]
    paciente_id = solicitacao["paciente_id"]
    headers = {"Authorization": f"Bearer {token_admin}"}

    resposta = cliente.put(
        f"/pacientes/{paciente_id}/solicitacoes/{solicitacao['id']}/renovar-link",
        headers=headers,
    )
    assert resposta.status_code == 200, resposta.text
    token_novo = resposta.json()["token_publico"]
    assert token_novo != token_antigo

    assert cliente.get(f"/portal/{token_antigo}").status_code == 404
    assert cliente.get(f"/portal/{token_novo}").status_code == 200


def test_renovar_link_requer_permissao(cliente, sessao_db):
    from app.database.models import Usuario
    from app.auth.jwt import criptografar_senha

    outro = Usuario(
        nome="Sem Permissao", email="sem-permissao-portal@teste.com",
        senha_hash=criptografar_senha("senha-123456"), perfil="usuario",
        permissoes=[], ativo=True,
    )
    sessao_db.add(outro)
    sessao_db.commit()

    login = cliente.post("/login", json={"email": "sem-permissao-portal@teste.com", "senha": "senha-123456"})
    token = login.json()["access_token"]

    resposta = cliente.put(
        "/pacientes/1/solicitacoes/1/renovar-link",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resposta.status_code == 403


def test_confirmar_liberacao_dispara_aviso_ao_paciente(cliente, token_admin, sessao_db, monkeypatch):
    chamadas = []
    monkeypatch.setattr(
        paciente_service, "enviar_email_resultado_disponivel",
        lambda item: chamadas.append(item.id),
    )

    solicitacao = _criar_paciente_com_exame(sessao_db, cliente, token_admin)
    item_id = solicitacao["amostras"][0]["itens"][0]["id"]
    headers = {"Authorization": f"Bearer {token_admin}"}

    cliente.put(f"/amostras/itens/{item_id}/resultado", json={"valor_resultado": "90"}, headers=headers)
    resposta = cliente.put(f"/amostras/itens/{item_id}/confirmar", headers=headers)

    assert resposta.status_code == 200, resposta.text
    assert chamadas == [item_id]


def test_confirmar_liberacao_sem_email_configurado_nao_quebra(cliente, token_admin, sessao_db):
    """Sem EMAIL_REMETENTE/EMAIL_SENHA_APP no ambiente de teste, o envio deve so ser ignorado, sem erro."""
    solicitacao = _criar_paciente_com_exame(sessao_db, cliente, token_admin, email=None)
    item_id = solicitacao["amostras"][0]["itens"][0]["id"]
    headers = {"Authorization": f"Bearer {token_admin}"}

    cliente.put(f"/amostras/itens/{item_id}/resultado", json={"valor_resultado": "90"}, headers=headers)
    resposta = cliente.put(f"/amostras/itens/{item_id}/confirmar", headers=headers)

    assert resposta.status_code == 200, resposta.text
    assert resposta.json()["status_resultado"] == "disponivel"
