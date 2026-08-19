"""
Sugere correcoes de nomes de exames cadastrados que provavelmente sao so
erro de digitacao/formatacao em relacao ao "Guia de Referencia de Exames
Laboratoriais" (dados_referencia/guia_exames_laboratoriais.json) -- por
exemplo "AC. B2 ANTITRONINA I" no seu cadastro quando o guia tem
"AC. B2 ANTITROMBINA I". Corrigir esses nomes permite que
preencher_dados_referencia_exames.py encontre a correspondencia e
complete os dados de coleta desses exames.

Este script NAO ALTERA NADA no banco. Ele so le e grava um arquivo CSV
(backend/sugestoes_correcao_nomes.csv) com as sugestoes, para voce
revisar. Cada linha tem uma coluna "aplicar" vazia -- preencha com "sim"
nas linhas que voce confirma que estao corretas (edite o nome sugerido
se quiser algo diferente) e depois rode
aplicar_correcoes_nomes_exames.py para gravar as mudancas.

Seguranca: o script NUNCA sugere trocar um nome por outro que mude um
"token critico" -- isotipo de imunoglobulina (IgA/IgG/IgM/IgE/IgD),
qualquer palavra com numero (CD16 vs CD19, C3 vs C4, B19, IgG4, etc.),
algarismo romano (I/II/III...) ou letra isolada (A/B/C/D/E, como em
Hepatite B vs Hepatite C) ou sigla de virus (HBV/HCV/HSV/HTLV...).
Essas diferencas quase sempre sao exames CLINICAMENTE DIFERENTES, nunca
erro de digitacao, entao ficam de fora das sugestoes mesmo que o nome
pareca muito parecido.

Uso:
    python sugerir_correcoes_nomes_exames.py [local|producao]
"""

import sys
import os
import re
import csv
import json
import unicodedata

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

PASTA_DADOS = os.path.join(os.path.dirname(__file__), "dados_referencia")
ARQUIVO_GUIA = os.path.join(PASTA_DADOS, "guia_exames_laboratoriais.json")
ARQUIVO_SUGESTOES = os.path.join(os.path.dirname(__file__), "sugestoes_correcao_nomes.csv")

# quanto uma sugestao pode diferir do nome atual para ainda ser considerada
# "so erro de digitacao/formatacao" e nao um nome realmente diferente
DISTANCIA_MAXIMA = 4
DISTANCIA_RELATIVA_MAXIMA = 0.12  # distancia / tamanho do nome

ROMANOS = {"I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"}
ISOTIPOS = {"IGA", "IGG", "IGM", "IGE", "IGD"}
SIGLAS_VIRUS = {"HBV", "HCV", "HDV", "HEV", "HSV", "HTLV", "HHV", "HPV", "VSR"}


def normalizar(texto):
    if not texto:
        return ""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    upper = sem_acento.upper()
    upper = re.sub(r"[\"'’‘´`]", "", upper)
    upper = re.sub(r"\s*-\s*", "-", upper)
    upper = re.sub(r"\s*/\s*", "/", upper)
    return " ".join(upper.split())


def tokens(nome_normalizado):
    return re.findall(r"[A-Z0-9]+", nome_normalizado)


def tokens_criticos(lista_tokens):
    """Palavras cuja troca nunca deve ser sugerida como 'so erro de
    digitacao', mesmo com distancia de edicao baixa -- siglas curtas
    como DNA/ENA/RNA/ANA, CD16/CD19, IgA/IgG, C3/C4, Hepatite B/C
    costumam diferir por 1-2 caracteres e ainda assim serem exames
    clinicamente diferentes."""
    criticos = set()
    for tok in lista_tokens:
        if any(c.isdigit() for c in tok):
            criticos.add(tok)
        elif tok in ROMANOS:
            criticos.add(tok)
        elif tok in ISOTIPOS:
            criticos.add(tok)
        elif tok in SIGLAS_VIRUS:
            criticos.add(tok)
        elif tok.isalpha() and len(tok) <= 3:
            criticos.add(tok)
    return criticos


def levenshtein(a, b):
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    linha_anterior = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        linha_atual = [i] + [0] * len(b)
        for j, cb in enumerate(b, start=1):
            custo = 0 if ca == cb else 1
            linha_atual[j] = min(
                linha_anterior[j] + 1,        # remocao
                linha_atual[j - 1] + 1,       # insercao
                linha_anterior[j - 1] + custo,  # substituicao
            )
        linha_anterior = linha_atual
    return linha_anterior[-1]


def escolher_banco():
    load_dotenv()
    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python sugerir_correcoes_nomes_exames.py [local|producao]")
        sys.exit(1)
    alvo = "DATABASE_URL_PRODUCAO" if sys.argv[1] == "producao" else "DATABASE_URL"
    return create_engine(os.getenv(alvo))


def carregar_guia():
    with open(ARQUIVO_GUIA, encoding="utf-8") as f:
        linhas = json.load(f)
    guia = {}
    for linha in linhas:
        chave = normalizar(linha["exame"])
        if chave and chave not in guia:
            guia[chave] = linha["exame"]
    return guia


def main():
    engine = escolher_banco()
    Session = sessionmaker(bind=engine)
    sessao = Session()

    print("Lendo guia de referencia...")
    guia = carregar_guia()
    guia_itens = list(guia.items())  # [(chave_normalizada, nome_original), ...]

    exames = sessao.execute(text("SELECT id, nome FROM exames")).fetchall()
    print(f"{len(exames)} exames cadastrados no banco")

    nao_encontrados = [(e.id, e.nome) for e in exames if normalizar(e.nome) not in guia]
    print(f"{len(nao_encontrados)} sem correspondencia exata -- procurando sugestoes...")

    sugestoes = []
    for exame_id, nome_atual in nao_encontrados:
        chave_atual = normalizar(nome_atual)
        tokens_atual = tokens(chave_atual)
        criticos_atual = tokens_criticos(tokens_atual)

        melhor = None
        melhor_distancia = None

        for chave_guia, nome_guia in guia_itens:
            # corte rapido: nomes com tamanho muito diferente nunca sao "so digitacao"
            if abs(len(chave_guia) - len(chave_atual)) > DISTANCIA_MAXIMA:
                continue

            distancia = levenshtein(chave_atual, chave_guia)
            if distancia == 0 or distancia > DISTANCIA_MAXIMA:
                continue
            if distancia / max(len(chave_atual), len(chave_guia)) > DISTANCIA_RELATIVA_MAXIMA:
                continue

            criticos_guia = tokens_criticos(tokens(chave_guia))
            if criticos_atual != criticos_guia:
                continue  # troca token critico (IgA/IgG, CD16/CD19, Hepatite B/C...) -- nunca sugere

            if melhor_distancia is None or distancia < melhor_distancia:
                melhor = nome_guia
                melhor_distancia = distancia

        if melhor is not None:
            sugestoes.append({
                "id": exame_id,
                "nome_atual": nome_atual,
                "sugestao": melhor,
                "distancia": melhor_distancia,
                "aplicar": "",
            })

    sugestoes.sort(key=lambda s: s["distancia"])

    with open(ARQUIVO_SUGESTOES, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "nome_atual", "sugestao", "distancia", "aplicar"])
        writer.writeheader()
        writer.writerows(sugestoes)

    print(f"\n{len(sugestoes)} sugestoes encontradas -> {ARQUIVO_SUGESTOES}")
    print("\nRevise o arquivo (ex: no Excel). Para cada linha que estiver correta,")
    print("escreva 'sim' na coluna 'aplicar' (pode editar a coluna 'sugestao' se quiser")
    print("um nome diferente do proposto). Deixe em branco as que voce nao quer mudar.")
    print("Depois rode: python aplicar_correcoes_nomes_exames.py [local|producao]")

    print("\nPrimeiras sugestoes:")
    for s in sugestoes[:20]:
        print(f"  [{s['distancia']}] {s['nome_atual']!r} -> {s['sugestao']!r}")
    if len(sugestoes) > 20:
        print(f"  ... e mais {len(sugestoes) - 20} no arquivo CSV")


if __name__ == "__main__":
    main()
