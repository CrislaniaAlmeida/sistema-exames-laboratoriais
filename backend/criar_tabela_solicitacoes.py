"""
Script de migracao: cria as tabelas "solicitacoes_exames" e
"solicitacao_exames", usadas para registrar os exames pedidos para um
paciente (a lista que a recepcao monta antes de clicar em "Concluir" na
tela de cadastro do paciente).

E seguro rodar mais de uma vez (usa "CREATE TABLE IF NOT EXISTS").

Uso:
    python criar_tabela_solicitacoes.py local       -> aplica no banco local (.env)
    python criar_tabela_solicitacoes.py producao    -> aplica no banco de producao (Neon)
"""

import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

SQL_CRIAR_TABELAS = """
CREATE TABLE IF NOT EXISTS solicitacoes_exames (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    paciente_id         INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    data_solicitacao    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS solicitacao_exames (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitacao_id      INTEGER NOT NULL REFERENCES solicitacoes_exames(id) ON DELETE CASCADE,
    exame_id            INTEGER REFERENCES exames(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_paciente ON solicitacoes_exames (paciente_id);
CREATE INDEX IF NOT EXISTS idx_solicitacao_exames_solicitacao ON solicitacao_exames (solicitacao_id);
"""


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python criar_tabela_solicitacoes.py [local|producao]")
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
        print("Criando tabelas de solicitacao de exames (se ainda nao existirem)...")
        conexao.execute(text(SQL_CRIAR_TABELAS))

    print("\nConcluido! O banco agora suporta pedidos de exames por paciente.")


if __name__ == "__main__":
    main()
