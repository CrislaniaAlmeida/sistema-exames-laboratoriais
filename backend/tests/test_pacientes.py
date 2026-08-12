from datetime import date

from app.database.models import Paciente


def _payload_paciente(**sobrescreve):
    dados = {
        "nome": "Paciente de Teste",
        "cpf": "11144477735",
        "data_nascimento": "1990-01-01",
    }
    dados.update(sobrescreve)
    return dados


def test_criar_paciente_com_cpf_valido(cliente, token_admin):
    resposta = cliente.post(
        "/pacientes/",
        json=_payload_paciente(),
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 201, resposta.text
    assert resposta.json()["codigo"].startswith("PAC-")


def test_criar_paciente_rejeita_cpf_com_digitos_iguais(cliente, token_admin):
    resposta = cliente.post(
        "/pacientes/",
        json=_payload_paciente(cpf="11111111111"),
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 422


def test_criar_paciente_rejeita_email_invalido(cliente, token_admin):
    resposta = cliente.post(
        "/pacientes/",
        json=_payload_paciente(email="isso-nao-e-um-email"),
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 422


def test_criar_paciente_aceita_email_valido(cliente, token_admin):
    resposta = cliente.post(
        "/pacientes/",
        json=_payload_paciente(email="paciente@teste.com"),
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 201


def test_atualizar_paciente_com_cpf_legado_invalido_nao_bloqueia_edicao(cliente, token_admin, sessao_db):
    """
    Pacientes cadastrados antes da validacao de CPF existir podem ter CPF
    invalido salvo. Editar outros campos desse paciente sem tocar no CPF
    nao deve ser bloqueado por essa validacao retroativa.
    """
    paciente_legado = Paciente(
        codigo="PAC-999999",
        nome="Paciente Antigo",
        cpf="12345678900",  # CPF com digito verificador invalido, salvo antes da validacao existir
        data_nascimento=date(1985, 5, 5),
    )
    sessao_db.add(paciente_legado)
    sessao_db.commit()

    resposta = cliente.put(
        f"/pacientes/{paciente_legado.id}",
        json={"nome": "Paciente Antigo Atualizado"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 200, resposta.text
    assert resposta.json()["nome"] == "Paciente Antigo Atualizado"


def test_atualizar_paciente_trocando_para_cpf_invalido_e_bloqueado(cliente, token_admin, sessao_db):
    paciente = Paciente(
        codigo="PAC-999998",
        nome="Paciente Valido",
        cpf="11144477735",
        data_nascimento=date(1985, 5, 5),
    )
    sessao_db.add(paciente)
    sessao_db.commit()

    resposta = cliente.put(
        f"/pacientes/{paciente.id}",
        json={"cpf": "11111111111"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 400


def test_excluir_paciente_e_exclusao_logica(cliente, token_admin, sessao_db):
    """
    Excluir um paciente nao pode apagar de verdade o registro (e em
    cascata as solicitacoes/amostras/resultados dele) -- so marca como
    inativo, para sumir da lista sem perder o historico clinico.
    """
    headers = {"Authorization": f"Bearer {token_admin}"}
    resposta = cliente.post("/pacientes/", json=_payload_paciente(), headers=headers)
    paciente_id = resposta.json()["id"]

    resposta = cliente.delete(f"/pacientes/{paciente_id}", headers=headers)
    assert resposta.status_code == 200, resposta.text

    paciente = sessao_db.query(Paciente).filter(Paciente.id == paciente_id).first()
    assert paciente is not None, "o registro nao deveria ter sido apagado do banco"
    assert paciente.ativo is False

    resposta = cliente.get("/pacientes/", headers=headers)
    ids_listados = [p["id"] for p in resposta.json()]
    assert paciente_id not in ids_listados

    resposta = cliente.get(f"/pacientes/{paciente_id}", headers=headers)
    assert resposta.status_code == 404
