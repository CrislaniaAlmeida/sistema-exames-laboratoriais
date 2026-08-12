"""
Script de migracao: cria a tabela "log_auditoria".

O modelo LogAuditoria ja existia no codigo (app/database/models.py),
mas a tabela nunca tinha sido criada no banco nem alimentada por
nenhum middleware -- este script cria a tabela, e o middleware de
auditoria (app/middlewares/auditoria.py) passa a gravar nela toda
requisicao a rotas de dados sensiveis (pacientes, amostras/resultados,
usuarios, portal do paciente).

E seguro rodar mais de uma vez (nao duplica nem apaga nada).

Uso:
    python adicionar_log_auditoria.py local       -> aplica no banco local (.env)
    python adicionar_log_auditoria.py producao    -> aplica no banco de producao (Neon)
"""

import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python adicionar_log_auditoria.py [local|producao]")
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
        print("Criando tabela 'log_auditoria'...")
        conexao.execute(text(
            """
            CREATE TABLE IF NOT EXISTS log_auditoria (
                id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                usuario_id      INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
                usuario_nome    VARCHAR(150),
                metodo          VARCHAR(10) NOT NULL,
                caminho         VARCHAR(300) NOT NULL,
                status_code     INTEGER NOT NULL,
                ip              VARCHAR(50),
                criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        ))
        conexao.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_log_auditoria_criado_em ON log_auditoria (criado_em DESC)"
        ))
        conexao.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_log_auditoria_usuario ON log_auditoria (usuario_id)"
        ))

    print("\nConcluido! A trilha de auditoria agora e alimentada automaticamente")
    print("e pode ser consultada em Relatorios > Auditoria (perfil admin).")


if __name__ == "__main__":
    main()
