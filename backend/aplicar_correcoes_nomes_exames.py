"""
Aplica as correcoes de nome de exame aprovadas no arquivo
backend/sugestoes_correcao_nomes.csv (gerado e revisado a partir de
sugerir_correcoes_nomes_exames.py).

So aplica a linha se a coluna "aplicar" estiver marcada com "sim" (sem
diferenciar maiusculas/minusculas). Por seguranca, antes de gravar,
confere se o nome atual do exame no banco ainda e exatamente o mesmo
que estava no CSV quando a sugestao foi gerada -- se alguem editou o
nome desse exame nesse meio tempo, a linha e pulada e avisada.

Depois de rodar este script, rode novamente
preencher_dados_referencia_exames.py para completar os dados de coleta
dos exames que passaram a ter correspondencia no guia.

Uso:
    python aplicar_correcoes_nomes_exames.py [local|producao]
"""

import sys
import os
import csv

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

ARQUIVO_SUGESTOES = os.path.join(os.path.dirname(__file__), "sugestoes_correcao_nomes.csv")


def escolher_banco():
    load_dotenv()
    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python aplicar_correcoes_nomes_exames.py [local|producao]")
        sys.exit(1)

    if sys.argv[1] == "producao":
        print("⚠️  Voce esta prestes a RENOMEAR exames no banco de PRODUCAO (Neon).")
        confirmacao = input("Digite 'CONFIRMAR' para continuar: ")
        if confirmacao != "CONFIRMAR":
            print("Cancelado.")
            sys.exit(0)
        return create_engine(os.getenv("DATABASE_URL_PRODUCAO"))
    else:
        return create_engine(os.getenv("DATABASE_URL"))


def carregar_aprovadas():
    if not os.path.exists(ARQUIVO_SUGESTOES):
        print(f"Arquivo nao encontrado: {ARQUIVO_SUGESTOES}")
        print("Rode primeiro: python sugerir_correcoes_nomes_exames.py [local|producao]")
        sys.exit(1)

    aprovadas = []
    with open(ARQUIVO_SUGESTOES, encoding="utf-8") as f:
        for linha in csv.DictReader(f):
            if linha.get("aplicar", "").strip().lower() in ("sim", "s", "yes", "y"):
                aprovadas.append(linha)
    return aprovadas


def main():
    aprovadas = carregar_aprovadas()
    if not aprovadas:
        print("Nenhuma linha marcada com 'sim' na coluna 'aplicar'. Nada a fazer.")
        return

    engine = escolher_banco()
    Session = sessionmaker(bind=engine)
    sessao = Session()

    renomeados = []
    pulados = []

    for linha in aprovadas:
        exame_id = int(linha["id"])
        nome_esperado = linha["nome_atual"]
        nome_novo = linha["sugestao"].strip()

        atual = sessao.execute(
            text("SELECT nome FROM exames WHERE id = :id"), {"id": exame_id}
        ).scalar()

        if atual is None:
            pulados.append((exame_id, nome_esperado, "exame nao existe mais"))
            continue
        if atual != nome_esperado:
            pulados.append((exame_id, nome_esperado, f"nome mudou no banco para {atual!r} desde a sugestao"))
            continue

        sessao.execute(
            text("UPDATE exames SET nome = :novo WHERE id = :id"),
            {"novo": nome_novo, "id": exame_id},
        )
        renomeados.append((nome_esperado, nome_novo))

    sessao.commit()

    print(f"\n{len(renomeados)} exame(s) renomeado(s):")
    for antigo, novo in renomeados:
        print(f"  {antigo!r} -> {novo!r}")

    if pulados:
        print(f"\n{len(pulados)} linha(s) pulada(s):")
        for exame_id, nome, motivo in pulados:
            print(f"  id={exame_id} {nome!r}: {motivo}")

    if renomeados:
        print("\nAgora rode novamente: python preencher_dados_referencia_exames.py [local|producao]")
        print("para completar os dados de coleta desses exames recem-casados com o guia.")


if __name__ == "__main__":
    main()
