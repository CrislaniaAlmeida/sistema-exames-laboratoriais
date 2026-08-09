"""
Script de importacao do Catalogo Ampliado de Exames Laboratoriais.
Le a aba "CATALOGO GERAL" da planilha em dados_importacao/ e cadastra
os exames dos setores selecionados, pulando qualquer exame que ja
exista no banco (comparacao por nome, sem diferenciar maiusculas/
minusculas ou acentuacao).

Cada exame e cadastrado apenas com nome e setor_responsavel. Os demais
campos (material, tubo, preparo do paciente etc.) ficam em branco para
serem completados depois pela tela "Gerenciar Exames".

Uso:
    python importar_catalogo_setores.py local       -> importa no banco local (.env)
    python importar_catalogo_setores.py producao    -> importa no banco de producao (Neon)

Por padrao importa os setores: Bioquimica, Hematologia, Hormonios,
Urinalise e Parasitologia. Para importar todos os setores da planilha,
adicione "todos" como segundo argumento:

    python importar_catalogo_setores.py local todos
"""

import sys
import os
import unicodedata
import openpyxl
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

PASTA_DADOS = os.path.join(os.path.dirname(__file__), "dados_importacao")
ARQUIVO_CATALOGO = os.path.join(PASTA_DADOS, "Catalogo_Ampliado_Exames_Laboratoriais.xlsx")
ABA_CATALOGO = "CATÁLOGO GERAL"

SETORES_PADRAO = ["Bioquímica", "Hematologia", "Hormônios", "Urinálise", "Parasitologia"]


def normalizar(texto):
    """Remove acentos e caixa para comparacao (ex: 'Bioquímica' -> 'bioquimica')."""
    if not texto:
        return ""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    return sem_acento.strip().upper()


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python importar_catalogo_setores.py [local|producao] [todos]")
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


def importar_todos_setores():
    return len(sys.argv) > 2 and sys.argv[2].lower() == "todos"


def carregar_catalogo():
    """Retorna lista de tuplas (setor, nome_exame) da aba CATALOGO GERAL."""
    wb = openpyxl.load_workbook(ARQUIVO_CATALOGO, data_only=True)
    ws = wb[ABA_CATALOGO]

    setores_desejados = None
    if not importar_todos_setores():
        setores_desejados = {normalizar(s) for s in SETORES_PADRAO}

    itens = []
    for linha in ws.iter_rows(min_row=2, values_only=True):
        setor, exame = linha[0], linha[1]
        if not setor or not exame:
            continue

        if setores_desejados is not None and normalizar(setor) not in setores_desejados:
            continue

        itens.append((setor.strip(), exame.strip()))

    return itens


def main():
    engine = escolher_banco()
    Session = sessionmaker(bind=engine)
    sessao = Session()

    print("Lendo planilha...")
    itens = carregar_catalogo()
    print(f"  {len(itens)} exames encontrados nos setores selecionados")

    # Mapa de setores ja usados no banco, para reaproveitar a grafia existente
    # (evita criar "Bioquimica" e "Bioquímica" como categorias diferentes).
    setores_existentes = sessao.execute(
        text("SELECT DISTINCT setor_responsavel FROM exames WHERE setor_responsavel IS NOT NULL")
    ).fetchall()
    mapa_setor_grafia = {normalizar(s[0]): s[0] for s in setores_existentes}

    # Nomes de exames ja cadastrados (normalizados, para comparacao sem acento/caixa).
    nomes_existentes = sessao.execute(text("SELECT nome FROM exames")).fetchall()
    nomes_existentes_normalizados = {normalizar(n[0]) for n in nomes_existentes}

    print("\nCadastrando exames...")
    criados = 0
    pulados = 0

    for setor, nome_exame in itens:
        nome_normalizado = normalizar(nome_exame)

        if nome_normalizado in nomes_existentes_normalizados:
            pulados += 1
            continue

        setor_final = mapa_setor_grafia.get(normalizar(setor), setor)

        sessao.execute(
            text("""
                INSERT INTO exames (nome, setor_responsavel, ativo)
                VALUES (:nome, :setor, true)
            """),
            {"nome": nome_exame, "setor": setor_final},
        )
        nomes_existentes_normalizados.add(nome_normalizado)
        criados += 1

    sessao.commit()
    sessao.close()

    print(f"\nConcluido!")
    print(f"  {criados} exames criados")
    print(f"  {pulados} exames ja existiam (pulados, nenhuma duplicata criada)")


if __name__ == "__main__":
    main()
