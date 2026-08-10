"""
Script de migracao: adiciona a base para a tela de Liberacao de
Exames (dividida por setor, com prazo e atraso).

O que este script faz:
  1. Adiciona na tabela "exames" os campos:
     equipamento (texto livre, ex: "Cobas 8000") e
     prazo_liberacao_horas (numero de horas para liberar o resultado,
     usado para calcular atraso -- substitui, para esse calculo, o
     texto livre de "prazo_liberacao_resultado", que continua existindo
     para exibicao).
  2. Adiciona na tabela "amostras" o campo recebido_em (horario em que
     a amostra chegou ao setor interno -- marcado junto da coleta,
     quando o exame nao e terceirizado a laboratorio de apoio).

Isso e a base para a tela de Liberacao de Exames, que lista os exames
internos aguardando resultado agrupados por setor, com indicacao de
atraso.

E seguro rodar mais de uma vez.

Uso:
    python adicionar_liberacao_exames.py local       -> aplica no banco local (.env)
    python adicionar_liberacao_exames.py producao    -> aplica no banco de producao (Neon)
"""

import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python adicionar_liberacao_exames.py [local|producao]")
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
        print("Adicionando campos de equipamento e prazo na tabela 'exames'...")
        conexao.execute(text(
            "ALTER TABLE exames ADD COLUMN IF NOT EXISTS equipamento VARCHAR(150)"
        ))
        conexao.execute(text(
            "ALTER TABLE exames ADD COLUMN IF NOT EXISTS prazo_liberacao_horas DOUBLE PRECISION"
        ))

        print("Adicionando campo de recebimento na tabela 'amostras'...")
        conexao.execute(text(
            "ALTER TABLE amostras ADD COLUMN IF NOT EXISTS recebido_em TIMESTAMP WITH TIME ZONE"
        ))

    print("\nConcluido! Agora e possivel configurar equipamento e prazo (em horas) em")
    print("Gerenciar Exames, e acompanhar a Liberacao de Exames por setor.")


if __name__ == "__main__":
    main()
