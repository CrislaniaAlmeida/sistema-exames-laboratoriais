"""
Script de importacao da planilha de materiais de citologia, histopatologia
e culturas.

Le as 3 abas de dados_importacao/materiais_citologia_histopatologia_culturas.xlsx
(Citologia, Histopatologia_PAS, Materiais_para_Culturas) e cadastra na tabela
"materiais" apenas o nome do material (coluna "Material") -- as colunas
"Categoria" e "Exemplo / aplicacao" nao sao importadas porque a tabela
"materiais" so guarda o nome.

A comparacao com os materiais ja existentes (ex: "Urina", "Fezes", que ja
vem no cadastro padrao do sistema) e feita sem acento/caixa, entao nenhuma
duplicata e criada.

Uso:
    python importar_materiais_exames.py local       -> importa no banco local (.env)
    python importar_materiais_exames.py producao    -> importa no banco de producao (Neon)
"""

import sys
import os
import unicodedata
import openpyxl
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

PASTA_DADOS = os.path.join(os.path.dirname(__file__), "dados_importacao")
ARQUIVO_PLANILHA = os.path.join(PASTA_DADOS, "materiais_citologia_histopatologia_culturas.xlsx")
ABAS_PLANILHA = ["Citologia", "Histopatologia_PAS", "Materiais_para_Culturas"]


def normalizar(texto):
    """Remove acentos e caixa (ex: 'Bioquímica' -> 'BIOQUIMICA')."""
    if not texto:
        return ""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    return sem_acento.strip().upper()


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python importar_materiais_exames.py [local|producao]")
        sys.exit(1)

    if sys.argv[1] == "producao":
        print("⚠️  Voce esta prestes a importar dados no banco de PRODUCAO (Neon).")
        confirmacao = input("Digite 'CONFIRMAR' para continuar: ")
        if confirmacao != "CONFIRMAR":
            print("Cancelado.")
            sys.exit(0)
        return create_engine(os.getenv("DATABASE_URL_PRODUCAO"))
    else:
        return create_engine(os.getenv("DATABASE_URL"))


def carregar_planilha():
    """Retorna lista de nomes de material (coluna B), na ordem em que aparecem, sem duplicar entre abas."""
    wb = openpyxl.load_workbook(ARQUIVO_PLANILHA, data_only=True)

    nomes = []
    vistos = set()
    for aba in ABAS_PLANILHA:
        ws = wb[aba]
        for linha in ws.iter_rows(min_row=2, values_only=True):
            material = linha[1] if len(linha) > 1 else None
            if not material:
                continue
            nome = material.strip()
            chave = normalizar(nome)
            if chave in vistos:
                continue
            vistos.add(chave)
            nomes.append(nome)

    return nomes


def main():
    engine = escolher_banco()
    Session = sessionmaker(bind=engine)
    sessao = Session()

    print("Lendo planilha...")
    nomes = carregar_planilha()
    print(f"  {len(nomes)} materiais unicos encontrados na planilha")

    materiais_existentes = sessao.execute(text("SELECT nome FROM materiais")).fetchall()
    nomes_existentes = {normalizar(m[0]) for m in materiais_existentes}

    print("\nCadastrando materiais...")
    criados = []
    pulados = []

    for nome in nomes:
        chave = normalizar(nome)
        if chave in nomes_existentes:
            pulados.append(nome)
            continue

        sessao.execute(
            text("INSERT INTO materiais (nome) VALUES (:nome)"),
            {"nome": nome},
        )
        nomes_existentes.add(chave)
        criados.append(nome)

    sessao.commit()
    sessao.close()

    print(f"\nConcluido!")
    print(f"  {len(criados)} materiais criados:")
    for nome in criados:
        print(f"    + {nome}")
    print(f"  {len(pulados)} materiais ja existiam (pulados, nenhuma duplicata criada):")
    for nome in pulados:
        print(f"    - {nome}")


if __name__ == "__main__":
    main()
