from datetime import date

from app.database.models import Paciente, Exame, Usuario, Laboratorio
from app.auth.jwt import criptografar_senha


def _criar_paciente_com_exames(sessao_db, cliente, token_admin):
    paciente = Paciente(
        codigo="PAC-000100",
        nome="Paciente Amostra",
        cpf="11144477735",
        data_nascimento=date(1990, 1, 1),
    )
    exame1 = Exame(nome="Hemograma", sigla="HC", setor_responsavel="Hematologia")
    exame2 = Exame(nome="Glicose", sigla="GLI", setor_responsavel="Bioquimica")
    sessao_db.add_all([paciente, exame1, exame2])
    sessao_db.commit()

    resposta = cliente.post(
        f"/pacientes/{paciente.id}/solicitacoes",
        json={"exame_ids": [exame1.id, exame2.id]},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


def test_amostras_criadas_comecam_aguardando_coleta_e_resultado(cliente, token_admin, sessao_db):
    solicitacao = _criar_paciente_com_exames(sessao_db, cliente, token_admin)
    assert len(solicitacao["amostras"]) >= 1
    for amostra in solicitacao["amostras"]:
        assert amostra["status"] == "aguardando_coleta"
        assert amostra["coletado_em"] is None
        for item in amostra["itens"]:
            assert item["status_resultado"] == "aguardando_resultado"


def test_marcar_amostra_como_coletada(cliente, token_admin, sessao_db):
    solicitacao = _criar_paciente_com_exames(sessao_db, cliente, token_admin)
    amostra_id = solicitacao["amostras"][0]["id"]

    resposta = cliente.put(
        f"/amostras/{amostra_id}/status",
        json={"status": "coletado"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 200, resposta.text
    assert resposta.json()["status"] == "coletado"
    assert resposta.json()["coletado_em"] is not None


def test_marcar_status_amostra_invalido_e_rejeitado(cliente, token_admin, sessao_db):
    solicitacao = _criar_paciente_com_exames(sessao_db, cliente, token_admin)
    amostra_id = solicitacao["amostras"][0]["id"]

    resposta = cliente.put(
        f"/amostras/{amostra_id}/status",
        json={"status": "nao_existe"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 422


def test_marcar_resultado_de_exame_disponivel(cliente, token_admin, sessao_db):
    solicitacao = _criar_paciente_com_exames(sessao_db, cliente, token_admin)
    item_id = solicitacao["amostras"][0]["itens"][0]["id"]

    resposta = cliente.put(
        f"/amostras/itens/{item_id}/status",
        json={"status_resultado": "disponivel"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 200, resposta.text
    assert resposta.json()["status_resultado"] == "disponivel"
    assert resposta.json()["resultado_disponivel_em"] is not None


def test_painel_pendentes_nao_mostra_amostra_totalmente_concluida(cliente, token_admin, sessao_db):
    solicitacao = _criar_paciente_com_exames(sessao_db, cliente, token_admin)
    amostra = solicitacao["amostras"][0]
    headers = {"Authorization": f"Bearer {token_admin}"}

    cliente.put(f"/amostras/{amostra['id']}/status", json={"status": "coletado"}, headers=headers)
    for item in amostra["itens"]:
        cliente.put(f"/amostras/itens/{item['id']}/status", json={"status_resultado": "disponivel"}, headers=headers)

    resposta_pendentes = cliente.get("/amostras/painel", params={"apenas_pendentes": True}, headers=headers)
    ids_pendentes = [a["id"] for a in resposta_pendentes.json()]
    assert amostra["id"] not in ids_pendentes

    resposta_todas = cliente.get("/amostras/painel", params={"apenas_pendentes": False}, headers=headers)
    ids_todas = [a["id"] for a in resposta_todas.json()]
    assert amostra["id"] in ids_todas


def test_coletador_com_amostras_gerenciar_acessa_painel(cliente, sessao_db):
    coletador = Usuario(
        nome="Coletador",
        email="coletador@teste.com",
        senha_hash=criptografar_senha("senha-123456"),
        perfil="coletador",
        permissoes=["amostras_gerenciar"],
        ativo=True,
    )
    sessao_db.add(coletador)
    sessao_db.commit()

    login = cliente.post("/login", json={"email": "coletador@teste.com", "senha": "senha-123456"})
    token = login.json()["access_token"]

    resposta = cliente.get("/amostras/painel", headers={"Authorization": f"Bearer {token}"})
    assert resposta.status_code == 200


def test_recepcao_sem_amostras_gerenciar_nao_acessa_painel(cliente, sessao_db):
    """Recepcao so cadastra pacientes -- sem a permissao amostras_gerenciar, o painel fica escondido."""
    recepcao = Usuario(
        nome="Recepcao",
        email="recepcao@teste.com",
        senha_hash=criptografar_senha("senha-123456"),
        perfil="recepcao",
        permissoes=["pacientes_gerenciar"],
        ativo=True,
    )
    sessao_db.add(recepcao)
    sessao_db.commit()

    login = cliente.post("/login", json={"email": "recepcao@teste.com", "senha": "senha-123456"})
    token = login.json()["access_token"]

    resposta = cliente.get("/amostras/painel", headers={"Authorization": f"Bearer {token}"})
    assert resposta.status_code == 403


def test_usuario_sem_permissao_relevante_nao_acessa_painel(cliente, sessao_db):
    usuario_comum = Usuario(
        nome="Sem Permissao",
        email="sempermissao@teste.com",
        senha_hash=criptografar_senha("senha-123456"),
        perfil="usuario",
        permissoes=[],
        ativo=True,
    )
    sessao_db.add(usuario_comum)
    sessao_db.commit()

    login = cliente.post("/login", json={"email": "sempermissao@teste.com", "senha": "senha-123456"})
    token = login.json()["access_token"]

    resposta = cliente.get("/amostras/painel", headers={"Authorization": f"Bearer {token}"})
    assert resposta.status_code == 403


def test_destino_da_amostra_e_setor_quando_exame_e_interno(cliente, token_admin, sessao_db):
    solicitacao = _criar_paciente_com_exames(sessao_db, cliente, token_admin)
    amostra = solicitacao["amostras"][0]
    assert amostra["destino"] == "Hematologia"


def test_destino_da_amostra_e_laboratorio_quando_exame_e_terceirizado(cliente, token_admin, sessao_db):
    laboratorio = Laboratorio(nome="Laboratorio Apoio Central")
    sessao_db.add(laboratorio)
    sessao_db.commit()

    paciente = Paciente(
        codigo="PAC-000101",
        nome="Paciente Terceirizado",
        cpf="11144477735",
        data_nascimento=date(1990, 1, 1),
    )
    exame = Exame(
        nome="Exame Terceirizado", sigla="EXT",
        setor_responsavel="Hematologia", laboratorio_id=laboratorio.id,
    )
    sessao_db.add_all([paciente, exame])
    sessao_db.commit()

    resposta = cliente.post(
        f"/pacientes/{paciente.id}/solicitacoes",
        json={"exame_ids": [exame.id]},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 201, resposta.text
    assert resposta.json()["amostras"][0]["destino"] == "Laboratorio Apoio Central"


def test_verificar_admin_com_credenciais_validas(cliente, token_admin):
    resposta = cliente.post(
        "/usuarios/verificar-admin",
        json={"email": "admin@teste.com", "senha": "senha-admin-123"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 200
    assert resposta.json()["valido"] is True


def test_verificar_admin_rejeita_senha_errada(cliente, token_admin):
    resposta = cliente.post(
        "/usuarios/verificar-admin",
        json={"email": "admin@teste.com", "senha": "senha-errada"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 401


def test_verificar_admin_rejeita_usuario_que_nao_e_admin(cliente, token_admin, sessao_db):
    recepcao = Usuario(
        nome="Recepcao",
        email="recepcao2@teste.com",
        senha_hash=criptografar_senha("senha-123456"),
        perfil="recepcao",
        permissoes=["pacientes_gerenciar"],
        ativo=True,
    )
    sessao_db.add(recepcao)
    sessao_db.commit()

    resposta = cliente.post(
        "/usuarios/verificar-admin",
        json={"email": "recepcao2@teste.com", "senha": "senha-123456"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 401
