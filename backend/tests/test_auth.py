def test_login_com_credenciais_invalidas_retorna_401(cliente):
    resposta = cliente.post("/login", json={"email": "ninguem@teste.com", "senha": "errada"})
    assert resposta.status_code == 401


def test_login_bloqueia_apos_muitas_tentativas(cliente):
    for _ in range(5):
        resposta = cliente.post("/login", json={"email": "ninguem@teste.com", "senha": "errada"})
        assert resposta.status_code == 401

    resposta = cliente.post("/login", json={"email": "ninguem@teste.com", "senha": "errada"})
    assert resposta.status_code == 429


def test_cadastrar_usuario_sem_login_e_rejeitado(cliente):
    """Ninguem deve conseguir criar usuario sem estar autenticado como admin."""
    resposta = cliente.post(
        "/cadastrar-usuario",
        json={"nome": "Invasor", "email": "invasor@teste.com", "senha": "123456", "perfil": "admin"},
    )
    assert resposta.status_code in (401, 403)


def test_cadastrar_usuario_rejeita_senha_curta(cliente, token_admin):
    resposta = cliente.post(
        "/cadastrar-usuario",
        json={"nome": "Novo", "email": "novo@teste.com", "senha": "123", "perfil": "usuario"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 422


def test_cadastrar_usuario_aceita_senha_valida(cliente, token_admin):
    resposta = cliente.post(
        "/cadastrar-usuario",
        json={"nome": "Novo", "email": "novo@teste.com", "senha": "123456", "perfil": "usuario"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 201
    assert resposta.json()["deve_trocar_senha"] is True
