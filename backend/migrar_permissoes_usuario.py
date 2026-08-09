"""
Script de migracao: adiciona suporte a cargos e permissoes por usuario.

Isso e uma alteracao de estrutura do banco (schema), por isso nao pode
ser feita pelos scripts de importacao de dados -- precisa ser rodada uma
vez em cada banco (local e producao) antes de usar a tela "Gerenciar
Usuarios".

O que este script faz:
  1. Adiciona a coluna "permissoes" na tabela usuarios (lista em JSON,
     comeca vazia para quem ja existe).
  2. Amplia a regra de "perfil" valido para aceitar tambem 'recepcao' e
     'bioquimico', alem de 'admin' e 'usuario'.
  3. Adiciona a coluna "deve_trocar_senha" (comeca falsa para quem ja
     existe, entao ninguem que ja usa o sistema e afetado).

E seguro rodar mais de uma vez (nao duplica nem apaga nada).

Uso:
    python migrar_permissoes_usuario.py local       -> aplica no banco local (.env)
    python migrar_permissoes_usuario.py producao    -> aplica no banco de producao (Neon)
"""

import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python migrar_permissoes_usuario.py [local|producao]")
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
        print("Adicionando coluna 'permissoes'...")
        conexao.execute(text(
            "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permissoes JSONB NOT NULL DEFAULT '[]'::jsonb"
        ))

        print("Atualizando regra de perfis validos...")
        conexao.execute(text(
            "ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS check_perfil_valido"
        ))
        conexao.execute(text(
            "ALTER TABLE usuarios ADD CONSTRAINT check_perfil_valido "
            "CHECK (perfil IN ('admin', 'recepcao', 'bioquimico', 'usuario'))"
        ))

        print("Adicionando coluna 'deve_trocar_senha'...")
        conexao.execute(text(
            "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS deve_trocar_senha "
            "BOOLEAN NOT NULL DEFAULT FALSE"
        ))

    print("\nConcluido! O banco agora suporta cargos, permissoes e senha temporaria por usuario.")


if __name__ == "__main__":
    main()
