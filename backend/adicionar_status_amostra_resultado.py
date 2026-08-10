"""
Script de migracao: adiciona status de coleta e de resultado.

O que este script faz:
  1. Adiciona a coluna "status" na tabela amostras (comeca como
     'aguardando_coleta' para quem ja existe) e "coletado_em".
  2. Adiciona a coluna "status_resultado" na tabela solicitacao_exames
     (comeca como 'aguardando_resultado' para quem ja existe) e
     "resultado_disponivel_em".

Isso permite marcar no sistema quando uma amostra foi coletada e
quando o resultado de um exame ficou disponivel, alimentando o Painel
de Amostras.

E seguro rodar mais de uma vez (nao duplica nem apaga nada).

Uso:
    python adicionar_status_amostra_resultado.py local       -> aplica no banco local (.env)
    python adicionar_status_amostra_resultado.py producao    -> aplica no banco de producao (Neon)
"""

import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python adicionar_status_amostra_resultado.py [local|producao]")
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
        print("Adicionando status de coleta na tabela 'amostras'...")
        conexao.execute(text(
            "ALTER TABLE amostras ADD COLUMN IF NOT EXISTS status VARCHAR(20) "
            "NOT NULL DEFAULT 'aguardando_coleta'"
        ))
        conexao.execute(text(
            "ALTER TABLE amostras ADD COLUMN IF NOT EXISTS coletado_em TIMESTAMPTZ"
        ))
        conexao.execute(text(
            "ALTER TABLE amostras DROP CONSTRAINT IF EXISTS check_status_amostra_valido"
        ))
        conexao.execute(text(
            "ALTER TABLE amostras ADD CONSTRAINT check_status_amostra_valido "
            "CHECK (status IN ('aguardando_coleta', 'coletado'))"
        ))

        print("Adicionando status de resultado na tabela 'solicitacao_exames'...")
        conexao.execute(text(
            "ALTER TABLE solicitacao_exames ADD COLUMN IF NOT EXISTS status_resultado VARCHAR(20) "
            "NOT NULL DEFAULT 'aguardando_resultado'"
        ))
        conexao.execute(text(
            "ALTER TABLE solicitacao_exames ADD COLUMN IF NOT EXISTS resultado_disponivel_em TIMESTAMPTZ"
        ))
        conexao.execute(text(
            "ALTER TABLE solicitacao_exames DROP CONSTRAINT IF EXISTS check_status_resultado_valido"
        ))
        conexao.execute(text(
            "ALTER TABLE solicitacao_exames ADD CONSTRAINT check_status_resultado_valido "
            "CHECK (status_resultado IN ('aguardando_resultado', 'disponivel'))"
        ))

    print("\nConcluido! Amostras e exames antigos foram marcados como pendentes por padrao.")
    print("Agora e possivel usar o Painel de Amostras para marcar coleta e resultado.")


if __name__ == "__main__":
    main()
