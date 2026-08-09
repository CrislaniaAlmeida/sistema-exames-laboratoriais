"""
Script de importacao da planilha de referencia de Tubos de Coleta de Sangue.

Le a aba "Tubos de Coleta" em dados_importacao/ e cadastra os tubos que
ainda nao existem no banco. A comparacao e feita pela cor da tampa (sem
acento/caixa, ignorando texto entre parenteses ou apos "/"), entao um tubo
que ja existe com aquela cor (ex: "Tampa Amarela" já cadastrado) e sempre
pulado, mesmo que a planilha traga uma variante dele (ex: "Amarela (ACD)").
Isso evita duplicar tubos, mas pode deixar de fora alguma variante -- o
resumo no final mostra exatamente o que foi criado e o que foi pulado (e
por qual motivo), para voce revisar.

Cada tubo e cadastrado com cor e descricao (aditivo + principais usos).
A foto continua sendo adicionada depois pela tela "Gerenciar Tubos".

Uso:
    python importar_tubos_referencia.py local       -> importa no banco local (.env)
    python importar_tubos_referencia.py producao    -> importa no banco de producao (Neon)
"""

import sys
import os
import unicodedata
import openpyxl
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

PASTA_DADOS = os.path.join(os.path.dirname(__file__), "dados_importacao")
ARQUIVO_PLANILHA = os.path.join(PASTA_DADOS, "tubos_coleta_sangue.xlsx")
ABA_PLANILHA = "Tubos de Coleta"

STEMS_COR = [
    "AMAREL", "VERMELH", "AZUL", "VERDE", "ROX",
    "CINZA", "ROSA", "PRET", "LARANJA", "BRANC", "BEGE",
]

DESCRICAO_MAX = 200


def normalizar(texto):
    """Remove acentos e caixa (ex: 'Bioquímica' -> 'BIOQUIMICA')."""
    if not texto:
        return ""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    return sem_acento.strip().upper()


def nome_primario(cor_bruta):
    """Tira texto entre parenteses e apos '/' (ex: 'Roxa/Lavanda' -> 'Roxa')."""
    sem_parenteses = cor_bruta.split("(")[0]
    sem_barra = sem_parenteses.split("/")[0]
    return sem_barra.strip()


def stem_de(cor_bruta):
    """Devolve o radical de cor (ex: AMAREL) contido no nome, ou None se não achar."""
    normalizado = normalizar(nome_primario(cor_bruta))
    for stem in STEMS_COR:
        if stem in normalizado:
            return stem
    return None


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python importar_tubos_referencia.py [local|producao]")
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
    """Retorna lista de tuplas (cor, aditivo, observacoes, usos)."""
    wb = openpyxl.load_workbook(ARQUIVO_PLANILHA, data_only=True)
    ws = wb[ABA_PLANILHA]

    itens = []
    for linha in ws.iter_rows(min_row=3, values_only=True):
        cor, aditivo, observacoes, usos = linha[0], linha[1], linha[2], linha[3]
        if not cor:
            continue
        itens.append((cor.strip(), aditivo or "", observacoes or "", usos or ""))

    return itens


def montar_descricao(aditivo, usos):
    descricao = f"{aditivo}. Uso: {usos}" if usos else aditivo
    return descricao[:DESCRICAO_MAX]


def montar_nome_tubo(cor_bruta):
    """Nome de exibicao do tubo, seguindo o padrao 'Tampa <Cor>' ja usado no sistema."""
    primario = nome_primario(cor_bruta)
    if stem_de(cor_bruta) is None:
        # Sem radical de cor reconhecido (ex: "Royal Blue") -> mantem como esta.
        return primario
    return f"Tampa {primario}"


def main():
    engine = escolher_banco()
    Session = sessionmaker(bind=engine)
    sessao = Session()

    print("Lendo planilha...")
    itens = carregar_planilha()
    print(f"  {len(itens)} tubos encontrados na planilha")

    tubos_existentes = sessao.execute(text("SELECT cor FROM tubos")).fetchall()
    cores_existentes = [t[0] for t in tubos_existentes]
    stems_existentes = {stem_de(c) for c in cores_existentes if stem_de(c) is not None}
    nomes_existentes_sem_cor = {normalizar(c) for c in cores_existentes if stem_de(c) is None}

    print("\nCadastrando tubos...")
    criados = []
    pulados = []

    for cor_bruta, aditivo, observacoes, usos in itens:
        stem_novo = stem_de(cor_bruta)

        if stem_novo is not None:
            if stem_novo in stems_existentes:
                pulados.append((cor_bruta, "cor de tampa parecida ja cadastrada"))
                continue
        else:
            if normalizar(cor_bruta) in nomes_existentes_sem_cor:
                pulados.append((cor_bruta, "tubo com esse nome ja cadastrado"))
                continue

        nome_tubo = montar_nome_tubo(cor_bruta)
        descricao = montar_descricao(aditivo, usos)

        sessao.execute(
            text("INSERT INTO tubos (cor, descricao) VALUES (:cor, :descricao)"),
            {"cor": nome_tubo, "descricao": descricao},
        )

        if stem_novo is not None:
            stems_existentes.add(stem_novo)
        else:
            nomes_existentes_sem_cor.add(normalizar(cor_bruta))

        criados.append(nome_tubo)

    sessao.commit()
    sessao.close()

    print(f"\nConcluido!")
    print(f"  {len(criados)} tubos criados:")
    for nome in criados:
        print(f"    + {nome}")
    print(f"  {len(pulados)} tubos pulados (nenhuma duplicata criada):")
    for cor_bruta, motivo in pulados:
        print(f"    - {cor_bruta} ({motivo})")


if __name__ == "__main__":
    main()
