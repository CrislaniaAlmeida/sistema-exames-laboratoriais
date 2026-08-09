"""
Script de migracao: cria a tabela "amostras" e adiciona a coluna
"amostra_id" em solicitacao_exames.

Cada vez que uma solicitacao de exames e concluida, os exames sao
agrupados automaticamente por tubo (ou por setor, quando o exame ainda
nao tem tubo cadastrado) e cada grupo gera uma "amostra" com codigo
proprio (ex: AMO-000001) -- o mesmo codigo impresso no codigo de
barras da etiqueta. Isso deixa pronta a base para uma futura
integracao com aparelho de setor (hoje nao ha nenhum aparelho
conectado, mas a consulta por codigo ja funciona via API).

E seguro rodar mais de uma vez.

Uso:
    python criar_tabela_amostras.py local       -> aplica no banco local (.env)
    python criar_tabela_amostras.py producao    -> aplica no banco de producao (Neon)
"""

import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

SQL_MIGRACAO = """
CREATE TABLE IF NOT EXISTS amostras (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo          VARCHAR(20)  NOT NULL UNIQUE,
    solicitacao_id  INTEGER NOT NULL REFERENCES solicitacoes_exames(id) ON DELETE CASCADE,
    tubo_cor        VARCHAR(50),
    material        VARCHAR(100),
    setor           VARCHAR(100),
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_amostras_codigo ON amostras (codigo);
CREATE INDEX IF NOT EXISTS idx_amostras_solicitacao ON amostras (solicitacao_id);

ALTER TABLE solicitacao_exames
    ADD COLUMN IF NOT EXISTS amostra_id INTEGER REFERENCES amostras(id) ON DELETE SET NULL;
"""


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python criar_tabela_amostras.py [local|producao]")
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
        print("Criando tabela 'amostras' e coluna 'amostra_id'...")
        conexao.execute(text(SQL_MIGRACAO))

    print("\nConcluido! Solicitacoes novas ja vao gerar amostras com codigo proprio.")
    print("Solicitacoes antigas continuam funcionando, mas nao tem amostras retroativas.")


if __name__ == "__main__":
    main()
