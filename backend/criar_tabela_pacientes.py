"""
Script de migracao: cria a tabela "pacientes", usada pela tela
"Gerenciar Pacientes" (cadastro feito pela recepcao/coleta).

E seguro rodar mais de uma vez (usa "CREATE TABLE IF NOT EXISTS").

Uso:
    python criar_tabela_pacientes.py local       -> aplica no banco local (.env)
    python criar_tabela_pacientes.py producao    -> aplica no banco de producao (Neon)
"""

import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

SQL_CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS pacientes (
    id                      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo                  VARCHAR(20)  NOT NULL UNIQUE,

    nome                    VARCHAR(150) NOT NULL,
    nome_social             VARCHAR(150),
    cpf                     VARCHAR(14)  NOT NULL UNIQUE,
    rg                      VARCHAR(20),
    data_nascimento         DATE         NOT NULL,
    sexo                    VARCHAR(20),
    nacionalidade           VARCHAR(100),
    naturalidade            VARCHAR(100),
    nome_mae                VARCHAR(150),

    celular                 VARCHAR(20),
    telefone                VARCHAR(20),
    email                   VARCHAR(150),

    cep                     VARCHAR(10),
    logradouro              VARCHAR(200),
    numero                  VARCHAR(20),
    bairro                  VARCHAR(100),
    cidade                  VARCHAR(100),
    estado                  CHAR(2),

    cartao_sus              VARCHAR(20),
    convenio                VARCHAR(100),
    carteira_convenio       VARCHAR(50),
    crm_medico_solicitante  VARCHAR(50),

    toma_medicacao          BOOLEAN      NOT NULL DEFAULT FALSE,
    medicamentos            JSONB        NOT NULL DEFAULT '[]'::jsonb,
    observacoes_clinicas    TEXT,

    ativo                   BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pacientes_nome ON pacientes (nome);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf  ON pacientes (cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_codigo ON pacientes (codigo);
"""


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python criar_tabela_pacientes.py [local|producao]")
        sys.exit(1)

    if sys.argv[1] == "producao":
        print("⚠️  Voce esta prestes a alterar a estrutura do banco de PRODUCAO (Neon).")
        confirmacao = input("Digite 'CONFIRMAR' para continuar: ")
        if confirmacao != "CONFIRMAR":
            print("Cancelado.")
            sys.exit(0)
        return create_engine(os.getenv("DATABASE_URL_PRODUCAO"))
    else:
        return create_engine(os.getenv("DATABASE_URL"))


def main():
    engine = escolher_banco()

    with engine.begin() as conexao:
        print("Criando tabela 'pacientes' (se ainda nao existir)...")
        conexao.execute(text(SQL_CRIAR_TABELA))

    print("\nConcluido! O banco agora tem a tabela de pacientes.")


if __name__ == "__main__":
    main()
