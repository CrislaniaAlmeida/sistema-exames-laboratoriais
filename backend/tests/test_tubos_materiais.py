from app.database.models import Usuario
from app.auth.jwt import criptografar_senha


def _token_bioquimico(cliente, sessao_db):
    bioquimico = Usuario(
        nome="Bioquimico",
        email="bioquimico@teste.com",
        senha_hash=criptografar_senha("senha-123456"),
        perfil="bioquimico",
        permissoes=["exames_gerenciar", "amostras_gerenciar"],
        ativo=True,
    )
    sessao_db.add(bioquimico)
    sessao_db.commit()

    login = cliente.post("/login", json={"email": "bioquimico@teste.com", "senha": "senha-123456"})
    return login.json()["access_token"]


def test_bioquimico_nao_pode_criar_tubo(cliente, sessao_db):
    """Tubos agora e uma tela so de administrador -- nenhuma permissao granular libera isso."""
    token = _token_bioquimico(cliente, sessao_db)
    resposta = cliente.post(
        "/tubos/",
        json={"cor": "Tampa Verde"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resposta.status_code == 403


def test_bioquimico_nao_pode_criar_material(cliente, sessao_db):
    token = _token_bioquimico(cliente, sessao_db)
    resposta = cliente.post(
        "/materiais/",
        json={"nome": "Material Teste"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resposta.status_code == 403


def test_admin_pode_criar_tubo(cliente, token_admin):
    resposta = cliente.post(
        "/tubos/",
        json={"cor": "Tampa Verde"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert resposta.status_code == 201, resposta.text


def test_qualquer_usuario_logado_pode_listar_tubos(cliente, sessao_db):
    """Listar (so consultar) continua liberado para qualquer usuario autenticado."""
    token = _token_bioquimico(cliente, sessao_db)
    resposta = cliente.get("/tubos/", headers={"Authorization": f"Bearer {token}"})
    assert resposta.status_code == 200
