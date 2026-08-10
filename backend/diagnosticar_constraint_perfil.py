"""
Script de diagnostico: mostra todas as restricoes CHECK existentes na
coluna "perfil" da tabela usuarios.

Isso serve para investigar por que o cadastro de usuario esta falhando
com "violates check constraint usuarios_perfil_check" mesmo depois da
migracao adicionar_perfil_coletador.py ter rodado com sucesso -- sinal
de que existe uma segunda restricao antiga (com nome diferente) que
nunca foi removida.

Nao altera nada no banco, so consulta.

Uso:
    python diagnosticar_constraint_perfil.py local
    python diagnosticar_constraint_perfil.py producao
"""

import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python diagnosticar_constraint_perfil.py [local|producao]")
        sys.exit(1)

    if sys.argv[1] == "producao":
        return create_engine(os.getenv("DATABASE_URL_PRODUCAO"))
    else:
        return create_engine(os.getenv("DATABASE_URL"))


def main():
    engine = escolher_banco()

    with engine.connect() as conexao:
        resultado = conexao.execute(text("""
            SELECT conname AS nome_restricao, pg_get_constraintdef(oid) AS definicao
            FROM pg_constraint
            WHERE conrelid = 'usuarios'::regclass
              AND contype = 'c'
        """))
        linhas = resultado.fetchall()

    print(f"\n{len(linhas)} restricao(oes) CHECK encontrada(s) na tabela 'usuarios':\n")
    for nome, definicao in linhas:
        print(f"  - {nome}: {definicao}")
    print()


if __name__ == "__main__":
    main()
