from datetime import date, datetime, timedelta, timezone

from app.database.models import Paciente, Exame, Laboratorio, Amostra, SolicitacaoExame


def _criar_paciente_com_exame_interno(sessao_db, cliente, token_admin, prazo_liberacao_horas=None, setor="Bioquimica"):
    paciente = Paciente(
        codigo="PAC-000200",
        nome="Paciente Liberacao",
        cpf="11144477735",
        data_nascimento=date(1990, 1, 1),
    )
    exame = Exame(
        nome="Glicose", sigla="GLI", setor_responsavel=setor,
        prazo_liberacao_horas=prazo_liberacao_horas,
    )
    sessao_db.add_all([paciente, exame])
    sessao_db.commit()

    resposta = cliente.post(
        f"/pacientes/{paciente.id}/solicitacoes",
        json={"exame_ids": [exame.id]},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


def _criar_paciente_com_exame_terceirizado(sessao_db, cliente, token_admin):
    paciente = Paciente(
        codigo="PAC-000201",
        nome="Paciente Terceirizado",
        cpf="93541134780",
        data_nascimento=date(1990, 1, 1),
    )
    laboratorio = Laboratorio(nome="Laboratorio Apoio Central")
    sessao_db.add_all([paciente, laboratorio])
    sessao_db.commit()

    exame = Exame(
        nome="Exame Especial", sigla="ESP", setor_responsavel="Bioquimica",
        laboratorio_id=laboratorio.id, prazo_liberacao_horas=1,
    )
    sessao_db.add(exame)
    sessao_db.commit()

    resposta = cliente.post(
        f"/pacientes/{paciente.id}/solicitacoes",
        json={"exame_ids": [exame.id]},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


def test_liberacao_lista_apenas_exames_internos(cliente, token_admin, sessao_db):
    headers = {"Authorization": f"Bearer {token_admin}"}
    interno = _criar_paciente_com_exame_interno(sessao_db, cliente, token_admin)
    terceirizado = _criar_paciente_com_exame_terceirizado(sessao_db, cliente, token_admin)

    resposta = cliente.get("/amostras/liberacao", headers=headers)
    assert resposta.status_code == 200, resposta.text

    ids_retornados = [item["id"] for item in resposta.json()]
    assert interno["amostras"][0]["itens"][0]["id"] in ids_retornados
    assert terceirizado["amostras"][0]["itens"][0]["id"] not in ids_retornados


def test_liberacao_sem_prazo_quando_amostra_ainda_nao_recebida(cliente, token_admin, sessao_db):
    headers = {"Authorization": f"Bearer {token_admin}"}
    solicitacao = _criar_paciente_com_exame_interno(sessao_db, cliente, token_admin, prazo_liberacao_horas=1)

    resposta = cliente.get("/amostras/liberacao", headers=headers)
    item = next(i for i in resposta.json() if i["id"] == solicitacao["amostras"][0]["itens"][0]["id"])
    assert item["prazo_status"] == "sem_prazo"
    assert item["prazo_limite"] is None


def test_liberacao_marca_atrasado_quando_prazo_passou(cliente, token_admin, sessao_db):
    headers = {"Authorization": f"Bearer {token_admin}"}
    solicitacao = _criar_paciente_com_exame_interno(sessao_db, cliente, token_admin, prazo_liberacao_horas=1)
    amostra_id = solicitacao["amostras"][0]["id"]

    amostra = sessao_db.query(Amostra).filter(Amostra.id == amostra_id).first()
    amostra.recebido_em = datetime.now(timezone.utc) - timedelta(hours=2)
    sessao_db.commit()

    resposta = cliente.get("/amostras/liberacao", headers=headers)
    item = next(i for i in resposta.json() if i["id"] == solicitacao["amostras"][0]["itens"][0]["id"])
    assert item["prazo_status"] == "atrasado"
    assert item["prazo_limite"] is not None


def test_liberacao_marca_no_prazo_quando_ainda_ha_tempo(cliente, token_admin, sessao_db):
    headers = {"Authorization": f"Bearer {token_admin}"}
    solicitacao = _criar_paciente_com_exame_interno(sessao_db, cliente, token_admin, prazo_liberacao_horas=4)
    amostra_id = solicitacao["amostras"][0]["id"]

    amostra = sessao_db.query(Amostra).filter(Amostra.id == amostra_id).first()
    amostra.recebido_em = datetime.now(timezone.utc)
    sessao_db.commit()

    resposta = cliente.get("/amostras/liberacao", headers=headers)
    item = next(i for i in resposta.json() if i["id"] == solicitacao["amostras"][0]["itens"][0]["id"])
    assert item["prazo_status"] == "no_prazo"


def test_liberacao_lista_item_aguardando_confirmacao(cliente, token_admin, sessao_db):
    headers = {"Authorization": f"Bearer {token_admin}"}
    solicitacao = _criar_paciente_com_exame_interno(sessao_db, cliente, token_admin)
    item_id = solicitacao["amostras"][0]["itens"][0]["id"]

    cliente.put(f"/amostras/itens/{item_id}/resultado", json={"valor_resultado": "90"}, headers=headers)

    resposta = cliente.get("/amostras/liberacao", headers=headers)
    item = next(i for i in resposta.json() if i["id"] == item_id)
    assert item["status_resultado"] == "aguardando_confirmacao"
    assert item["lancado_por_nome"] == "Admin de Teste"


def test_liberacao_nao_lista_item_ja_confirmado(cliente, token_admin, sessao_db):
    headers = {"Authorization": f"Bearer {token_admin}"}
    solicitacao = _criar_paciente_com_exame_interno(sessao_db, cliente, token_admin)
    item_id = solicitacao["amostras"][0]["itens"][0]["id"]

    cliente.put(f"/amostras/itens/{item_id}/resultado", json={"valor_resultado": "90"}, headers=headers)
    cliente.put(f"/amostras/itens/{item_id}/confirmar", headers=headers)

    resposta = cliente.get("/amostras/liberacao", headers=headers)
    ids_retornados = [item["id"] for item in resposta.json()]
    assert item_id not in ids_retornados


def test_liberacao_requer_permissao_amostras_gerenciar(cliente, sessao_db):
    from app.database.models import Usuario
    from app.auth.jwt import criptografar_senha

    recepcao = Usuario(
        nome="Recepcao Liberacao", email="recepcao-liberacao@teste.com",
        senha_hash=criptografar_senha("senha-123456"), perfil="recepcao",
        permissoes=["pacientes_gerenciar"], ativo=True,
    )
    sessao_db.add(recepcao)
    sessao_db.commit()

    login = cliente.post("/login", json={"email": "recepcao-liberacao@teste.com", "senha": "senha-123456"})
    token = login.json()["access_token"]

    resposta = cliente.get("/amostras/liberacao", headers={"Authorization": f"Bearer {token}"})
    assert resposta.status_code == 403


def test_recebido_em_marcado_junto_da_coleta_para_exame_interno(cliente, token_admin, sessao_db):
    headers = {"Authorization": f"Bearer {token_admin}"}
    solicitacao = _criar_paciente_com_exame_interno(sessao_db, cliente, token_admin)
    amostra_id = solicitacao["amostras"][0]["id"]

    resposta = cliente.put(f"/amostras/{amostra_id}/status", json={"status": "coletado"}, headers=headers)
    assert resposta.status_code == 200, resposta.text

    amostra = sessao_db.query(Amostra).filter(Amostra.id == amostra_id).first()
    assert amostra.recebido_em is not None


def test_recebido_em_nao_marcado_para_exame_terceirizado(cliente, token_admin, sessao_db):
    headers = {"Authorization": f"Bearer {token_admin}"}
    solicitacao = _criar_paciente_com_exame_terceirizado(sessao_db, cliente, token_admin)
    amostra_id = solicitacao["amostras"][0]["id"]

    resposta = cliente.put(f"/amostras/{amostra_id}/status", json={"status": "coletado"}, headers=headers)
    assert resposta.status_code == 200, resposta.text

    amostra = sessao_db.query(Amostra).filter(Amostra.id == amostra_id).first()
    assert amostra.recebido_em is None
