"""
Script de migracao: portal do paciente (link unico) e segunda
checagem antes de liberar um resultado.

O que este script faz:
  1. Adiciona "token_publico" na tabela "solicitacoes_exames" -- o
     link unico usado pelo paciente para ver o proprio resultado e
     baixar o laudo, sem precisar de login. Gera um token para as
     solicitacoes que ja existem (que ainda nao tem um).
  2. Adiciona "lancado_por_id" e "lancado_em" na tabela
     "solicitacao_exames" -- quem digitou o valor do resultado antes
     da confirmacao final.
  3. Atualiza a regra (CHECK) de "status_resultado" para aceitar o
     novo status intermediario "aguardando_confirmacao".

Isso e a base para: link unico do laudo (portal do paciente) e o
fluxo de lancar resultado -> confirmar liberacao (mesmo que seja a
mesma pessoa a confirmar).

E seguro rodar mais de uma vez.

Uso:
    python adicionar_portal_e_confirmacao.py local       -> aplica no banco local (.env)
    python adicionar_portal_e_confirmacao.py producao    -> aplica no banco de producao (Neon)
"""

import secrets
import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python adicionar_portal_e_confirmacao.py [local|producao]")
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
        print("Adicionando 'token_publico' na tabela 'solicitacoes_exames'...")
        conexao.execute(text(
            "ALTER TABLE solicitacoes_exames ADD COLUMN IF NOT EXISTS token_publico VARCHAR(32) UNIQUE"
        ))

        print("Adicionando 'lancado_por_id' e 'lancado_em' na tabela 'solicitacao_exames'...")
        conexao.execute(text(
            "ALTER TABLE solicitacao_exames ADD COLUMN IF NOT EXISTS lancado_por_id "
            "INTEGER REFERENCES usuarios(id) ON DELETE SET NULL"
        ))
        conexao.execute(text(
            "ALTER TABLE solicitacao_exames ADD COLUMN IF NOT EXISTS lancado_em TIMESTAMP WITH TIME ZONE"
        ))

        print("Atualizando a regra de status_resultado para aceitar 'aguardando_confirmacao'...")
        conexao.execute(text(
            "ALTER TABLE solicitacao_exames DROP CONSTRAINT IF EXISTS check_status_resultado_valido"
        ))
        conexao.execute(text(
            "ALTER TABLE solicitacao_exames ADD CONSTRAINT check_status_resultado_valido "
            "CHECK (status_resultado IN ('aguardando_resultado', 'aguardando_confirmacao', 'disponivel'))"
        ))

        print("Gerando token publico para solicitacoes que ainda nao tem um...")
        ids = conexao.execute(text(
            "SELECT id FROM solicitacoes_exames WHERE token_publico IS NULL"
        )).fetchall()
        for (solicitacao_id,) in ids:
            token = secrets.token_urlsafe(18)
            conexao.execute(
                text("UPDATE solicitacoes_exames SET token_publico = :token WHERE id = :id"),
                {"token": token, "id": solicitacao_id},
            )
        print(f"  {len(ids)} solicitacao(oes) atualizada(s) com token novo.")

    print("\nConcluido! Agora o laudo tem um link unico (portal do paciente), e o lancamento")
    print("de resultado passa por uma segunda etapa de confirmacao antes de liberar.")


if __name__ == "__main__":
    main()
