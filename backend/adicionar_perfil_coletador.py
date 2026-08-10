"""
Script de migracao: adiciona o cargo "Coletador" como perfil valido.

Antes, coleta de amostras era feita por quem tivesse o cargo Recepcao.
Agora Coletador e um cargo proprio, com a permissao "amostras_gerenciar"
(acesso ao Painel de Amostras e a Triagem de Amostras).

Isso so amplia a regra de perfis validos -- nenhum usuario existente e
alterado.

E seguro rodar mais de uma vez.

Uso:
    python adicionar_perfil_coletador.py local       -> aplica no banco local (.env)
    python adicionar_perfil_coletador.py producao    -> aplica no banco de producao (Neon)
"""

import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python adicionar_perfil_coletador.py [local|producao]")
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
        print("Atualizando regra de perfis validos (adicionando 'coletador')...")
        conexao.execute(text(
            "ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS check_perfil_valido"
        ))
        conexao.execute(text(
            "ALTER TABLE usuarios ADD CONSTRAINT check_perfil_valido "
            "CHECK (perfil IN ('admin', 'recepcao', 'coletador', 'bioquimico', 'usuario'))"
        ))

    print("\nConcluido! Agora e possivel cadastrar usuarios com o cargo 'Coletador'.")


if __name__ == "__main__":
    main()
