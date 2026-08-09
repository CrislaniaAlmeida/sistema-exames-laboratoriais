"""
Script de migracao: adiciona a coluna "complemento" (apartamento, bloco,
sala etc.) ao endereco do paciente.

E seguro rodar mais de uma vez.

Uso:
    python adicionar_complemento_paciente.py local       -> aplica no banco local (.env)
    python adicionar_complemento_paciente.py producao    -> aplica no banco de producao (Neon)
"""

import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python adicionar_complemento_paciente.py [local|producao]")
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
        print("Adicionando coluna 'complemento' em pacientes...")
        conexao.execute(text(
            "ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS complemento VARCHAR(100)"
        ))

    print("\nConcluido! O endereco do paciente agora tem campo de complemento.")


if __name__ == "__main__":
    main()
