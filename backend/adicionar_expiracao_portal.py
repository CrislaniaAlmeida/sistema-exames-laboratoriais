"""
Script de migracao: da validade ao link do portal do paciente.

O que este script faz:
  1. Adiciona "token_publico_expira_em" na tabela "solicitacoes_exames"
     -- a partir de agora, todo link novo do portal vence em 90 dias
     (constante DIAS_VALIDADE_TOKEN_PORTAL em paciente_service.py).
  2. Links ja existentes (token_publico_expira_em NULL) continuam
     funcionando normalmente ate serem renovados -- essa migracao nao
     invalida nenhum link que ja foi compartilhado com um paciente.

Antes disso, o link "pessoal e intransferivel" enviado ao paciente
nunca vencia. Agora tambem e possivel revogar/renovar um link a
qualquer momento (PUT /pacientes/{id}/solicitacoes/{id}/renovar-link),
o que gera um token novo e invalida o antigo.

E seguro rodar mais de uma vez.

Uso:
    python adicionar_expiracao_portal.py local       -> aplica no banco local (.env)
    python adicionar_expiracao_portal.py producao    -> aplica no banco de producao (Neon)
"""

import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python adicionar_expiracao_portal.py [local|producao]")
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
        print("Adicionando 'token_publico_expira_em' na tabela 'solicitacoes_exames'...")
        conexao.execute(text(
            "ALTER TABLE solicitacoes_exames ADD COLUMN IF NOT EXISTS token_publico_expira_em TIMESTAMPTZ"
        ))

    print("\nConcluido! Links ja existentes continuam validos ate serem renovados;")
    print("todo link novo do portal agora vence em 90 dias.")


if __name__ == "__main__":
    main()
