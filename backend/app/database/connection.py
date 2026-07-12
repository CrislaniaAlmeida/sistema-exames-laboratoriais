import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# carrega as variáveis do arquivo .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Cria a conexão com o PostgreSQL
engine = create_engine(DATABASE_URL)

# Cria as "sessões" que o código vai usar para conversar com o banco
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Classe base que os modelos (tabelas) vão herdar
Base = declarative_base()


def get_db():
    """
    Fornece uma sessão do banco de dados para cada requisição da API, 
    e garante qie eça seja fechada corretamente no final.
    """

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
