import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./nao_deve_ser_usado.db")
os.environ.setdefault("SECRET_KEY", "chave-de-teste-apenas-para-testes-automatizados")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database.connection import Base, get_db
from app.main import app
from app.limiter import limiter
from app.database.models import Usuario
from app.auth.jwt import criptografar_senha

MOTOR_TESTE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SessaoTeste = sessionmaker(bind=MOTOR_TESTE, autocommit=False, autoflush=False)


def _sobrescrever_get_db():
    sessao = SessaoTeste()
    try:
        yield sessao
    finally:
        sessao.close()


app.dependency_overrides[get_db] = _sobrescrever_get_db


@pytest.fixture(autouse=True)
def banco_de_dados_limpo():
    """Cria as tabelas antes de cada teste e apaga tudo depois, para os testes nao interferirem entre si."""
    Base.metadata.create_all(bind=MOTOR_TESTE)
    limiter.reset()
    yield
    Base.metadata.drop_all(bind=MOTOR_TESTE)


@pytest.fixture
def cliente():
    return TestClient(app)


@pytest.fixture
def sessao_db():
    sessao = SessaoTeste()
    yield sessao
    sessao.close()


@pytest.fixture
def token_admin(cliente, sessao_db):
    """Cria um usuario admin direto no banco de teste e devolve um token valido (via login real)."""
    admin = Usuario(
        nome="Admin de Teste",
        email="admin@teste.com",
        senha_hash=criptografar_senha("senha-admin-123"),
        perfil="admin",
        permissoes=[],
        ativo=True,
    )
    sessao_db.add(admin)
    sessao_db.commit()

    resposta = cliente.post("/login", json={"email": "admin@teste.com", "senha": "senha-admin-123"})
    assert resposta.status_code == 200, resposta.text
    return resposta.json()["access_token"]
