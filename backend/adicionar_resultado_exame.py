"""
Script de migracao: adiciona lancamento de resultado com faixa de
referencia.

O que este script faz:
  1. Adiciona na tabela "exames" os campos de referencia:
     unidade_resultado, valor_referencia_min, valor_referencia_max,
     valor_referencia_texto -- configurados em Gerenciar Exames.
  2. Adiciona na tabela "solicitacao_exames" os campos do resultado
     lancado: valor_resultado, unidade_resultado, flag_resultado
     ('H'/'L'), observacoes_resultado e liberado_por_id (usuario que
     lancou/liberou o resultado).

Isso e a base para a tela de lancamento de resultado no Painel de
Amostras e para a geracao do laudo em PDF.

E seguro rodar mais de uma vez.

Uso:
    python adicionar_resultado_exame.py local       -> aplica no banco local (.env)
    python adicionar_resultado_exame.py producao    -> aplica no banco de producao (Neon)
"""

import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python adicionar_resultado_exame.py [local|producao]")
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
        print("Adicionando campos de referencia na tabela 'exames'...")
        conexao.execute(text(
            "ALTER TABLE exames ADD COLUMN IF NOT EXISTS unidade_resultado VARCHAR(30)"
        ))
        conexao.execute(text(
            "ALTER TABLE exames ADD COLUMN IF NOT EXISTS valor_referencia_min DOUBLE PRECISION"
        ))
        conexao.execute(text(
            "ALTER TABLE exames ADD COLUMN IF NOT EXISTS valor_referencia_max DOUBLE PRECISION"
        ))
        conexao.execute(text(
            "ALTER TABLE exames ADD COLUMN IF NOT EXISTS valor_referencia_texto TEXT"
        ))

        print("Adicionando campos de resultado na tabela 'solicitacao_exames'...")
        conexao.execute(text(
            "ALTER TABLE solicitacao_exames ADD COLUMN IF NOT EXISTS valor_resultado VARCHAR(100)"
        ))
        conexao.execute(text(
            "ALTER TABLE solicitacao_exames ADD COLUMN IF NOT EXISTS unidade_resultado VARCHAR(30)"
        ))
        conexao.execute(text(
            "ALTER TABLE solicitacao_exames ADD COLUMN IF NOT EXISTS flag_resultado VARCHAR(1)"
        ))
        conexao.execute(text(
            "ALTER TABLE solicitacao_exames ADD COLUMN IF NOT EXISTS observacoes_resultado TEXT"
        ))
        conexao.execute(text(
            "ALTER TABLE solicitacao_exames ADD COLUMN IF NOT EXISTS liberado_por_id "
            "INTEGER REFERENCES usuarios(id) ON DELETE SET NULL"
        ))

    print("\nConcluido! Agora e possivel configurar faixa de referencia em Gerenciar Exames")
    print("e lancar resultados com valor no Painel de Amostras.")


if __name__ == "__main__":
    main()
