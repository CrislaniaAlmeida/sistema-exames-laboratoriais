"""
Script de migracao: remove a restricao CHECK antiga e esquecida
"usuarios_perfil_check" da tabela usuarios.

Essa restricao existia desde o inicio do projeto e so permitia os
perfis 'admin' e 'usuario'. Quando os cargos Recepcao/Bioquimico
foram criados depois, uma nova restricao ("check_perfil_valido") foi
adicionada com a lista atualizada -- mas a antiga nunca foi removida,
porque tinha um nome diferente. Como o Postgres aplica todas as
restricoes CHECK ao mesmo tempo, ela ficou bloqueando silenciosamente
o cadastro de qualquer usuario com cargo diferente de admin/usuario.

E seguro rodar mais de uma vez.

Uso:
    python remover_constraint_perfil_antiga.py local
    python remover_constraint_perfil_antiga.py producao
"""

import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python remover_constraint_perfil_antiga.py [local|producao]")
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
        print("Removendo restricao antiga 'usuarios_perfil_check'...")
        conexao.execute(text(
            "ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_perfil_check"
        ))

    print("\nConcluido! Agora so a restricao 'check_perfil_valido' (com a lista atualizada) esta ativa.")
    print("Cadastro de usuarios com cargo Recepcao, Bioquimico ou Coletador deve funcionar normalmente.")


if __name__ == "__main__":
    main()
