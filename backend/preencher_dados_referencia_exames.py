"""
Preenche os campos de coleta/manuseio dos exames ja cadastrados
(material, tubo, volume minimo/ideal, jejum, metodo, armazenamento,
preparo do paciente e observacoes) usando como fonte o "Guia de
Referencia de Exames Laboratoriais" (backend/dados_referencia/
guia_exames_laboratoriais.json), compilado a partir de fontes publicas
(Hermes Pardini, DB Diagnosticos, Fleury e outros laboratorios de
apoio).

O guia deixa de fora, de proposito, os campos que sao especificos do
fluxo/contrato de cada instituicao e nao podem ser obtidos de fonte
publica: Codigo TUSS, Setor Responsavel, Tempo Maximo de Envio, Dias
de Realizacao e Prazo de Liberacao do Resultado. Esses continuam sem
preenchimento apos rodar este script.

Regras de preenchimento:
- So altera exames que ja existem no banco (nao cria exame novo).
- Casamento por nome do exame, ignorando acentos/caixa/espacos
  extras. Exames sem correspondencia exata no guia ficam intactos e
  aparecem no resumo final para revisao manual.
- So preenche campos que estao vazios (NULL ou string vazia); nunca
  sobrescreve o que ja foi cadastrado manualmente.
- Material: se o exame nao tiver material vinculado, procura um
  Material com esse nome (ignorando acentos/caixa) e cria um novo se
  nao existir.
- Tubo: se o exame nao tiver tubo vinculado, tenta reconhecer a cor
  da tampa no texto do guia (mesma logica de
  importar_tubos_referencia.py) e vincula a um tubo com essa cor SE
  ele ja existir cadastrado. Nunca cria tubo novo aqui -- a tabela de
  tubos e usada com foto para identificacao visual na coleta, e o
  texto do guia (ex.: "Tubo seco ou gel separador (amarelo/vermelho)")
  nao e um nome de tubo adequado para isso.
- Campos de texto curto (volume, jejum, metodo, armazenamento) que
  nao cabem no tamanho da coluna NAO sao truncados (para nao cortar
  instrucao clinica no meio) -- ficam de fora e aparecem no resumo.

Uso:
    python preencher_dados_referencia_exames.py local       -> roda no banco local (.env)
    python preencher_dados_referencia_exames.py producao    -> roda no banco de producao (Neon)
"""

import sys
import os
import re
import json
import unicodedata
from collections import defaultdict

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

PASTA_DADOS = os.path.join(os.path.dirname(__file__), "dados_referencia")
ARQUIVO_GUIA = os.path.join(PASTA_DADOS, "guia_exames_laboratoriais.json")

# mesma lista usada em importar_tubos_referencia.py
STEMS_COR = [
    "AMAREL", "VERMELH", "AZUL", "VERDE", "ROX",
    "CINZA", "ROSA", "PRET", "LARANJA", "BRANC", "BEGE",
]

LIMITE_TAMANHO = {
    "volume_minimo": 50,
    "volume_ideal": 50,
    "jejum_necessario": 100,
    "metodo_utilizado": 150,
    "temperatura_armazenamento": 100,
    # preparo_paciente e observacoes sao TEXT (sem limite pratico)
}

CAMPO_PARA_COLUNA_GUIA = {
    "volume_minimo": "vol_minimo",
    "volume_ideal": "vol_ideal",
    "jejum_necessario": "jejum",
    "metodo_utilizado": "metodo",
    "temperatura_armazenamento": "armazenamento_envio",
    "preparo_paciente": "preparo_paciente",
    "observacoes": "observacoes",
}


def normalizar(texto):
    """Remove acentos e caixa, colapsa espacos e padroniza aspas/hifen/barra
    (ex: 'Líquor (LCR)' -> 'LIQUOR (LCR)'; 'ADA - ADA' e 'ADA- ADA' e 'ADA -ADA'
    todos viram 'ADA-ADA'). So usada para casar nomes, nunca para gravar."""
    if not texto:
        return ""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    upper = sem_acento.upper()
    upper = re.sub(r"[\"'’‘´`]", "", upper)
    upper = re.sub(r"\s*-\s*", "-", upper)
    upper = re.sub(r"\s*/\s*", "/", upper)
    return " ".join(upper.split())


def stem_de(texto_bruto):
    normalizado = normalizar(texto_bruto)
    for stem in STEMS_COR:
        if stem in normalizado:
            return stem
    return None


def escolher_banco():
    load_dotenv()

    if len(sys.argv) < 2 or sys.argv[1] not in ("local", "producao"):
        print("Uso: python preencher_dados_referencia_exames.py [local|producao]")
        sys.exit(1)

    if sys.argv[1] == "producao":
        print("⚠️  Voce esta prestes a atualizar dados no banco de PRODUCAO (Neon).")
        confirmacao = input("Digite 'CONFIRMAR' para continuar: ")
        if confirmacao != "CONFIRMAR":
            print("Cancelado.")
            sys.exit(0)
        return create_engine(os.getenv("DATABASE_URL_PRODUCAO"))
    else:
        return create_engine(os.getenv("DATABASE_URL"))


def carregar_guia():
    """Retorna dict {nome_normalizado: registro}. Primeira ocorrencia vence
    quando o guia repete o mesmo exame com nomes ligeiramente diferentes."""
    with open(ARQUIVO_GUIA, encoding="utf-8") as f:
        linhas = json.load(f)

    guia = {}
    for linha in linhas:
        chave = normalizar(linha["exame"])
        if chave and chave not in guia:
            guia[chave] = linha
    return guia


def main():
    engine = escolher_banco()
    Session = sessionmaker(bind=engine)
    sessao = Session()

    print("Lendo guia de referencia...")
    guia = carregar_guia()
    print(f"  {len(guia)} exames unicos no guia")

    exames = sessao.execute(text("""
        SELECT id, nome, material_id, tubo_id, volume_minimo, volume_ideal,
               jejum_necessario, metodo_utilizado, temperatura_armazenamento,
               preparo_paciente, observacoes
        FROM exames
    """)).fetchall()
    print(f"  {len(exames)} exames cadastrados no banco")

    materiais_existentes = {
        normalizar(nome): mid
        for mid, nome in sessao.execute(text("SELECT id, nome FROM materiais")).fetchall()
    }

    tubos_existentes = sessao.execute(text("SELECT id, cor FROM tubos")).fetchall()
    tubo_id_por_stem = {}
    for tid, cor in tubos_existentes:
        stem = stem_de(cor)
        if stem is not None and stem not in tubo_id_por_stem:
            tubo_id_por_stem[stem] = tid

    nao_encontrados = []
    campos_grandes_demais = defaultdict(list)
    contagem_campo = defaultdict(int)
    materiais_criados = []
    tubos_vinculados = 0
    exames_atualizados = 0

    for exame in exames:
        chave = normalizar(exame.nome)
        linha = guia.get(chave)
        if linha is None:
            nao_encontrados.append(exame.nome)
            continue

        sets = {}

        for campo, coluna_guia in CAMPO_PARA_COLUNA_GUIA.items():
            valor_atual = getattr(exame, campo)
            valor_novo = (linha.get(coluna_guia) or "").strip()
            if valor_atual or not valor_novo:
                continue
            limite = LIMITE_TAMANHO.get(campo)
            if limite and len(valor_novo) > limite:
                campos_grandes_demais[campo].append((exame.nome, valor_novo))
                continue
            sets[campo] = valor_novo
            contagem_campo[campo] += 1

        if exame.material_id is None and linha.get("material"):
            chave_material = normalizar(linha["material"])
            material_id = materiais_existentes.get(chave_material)
            if material_id is None:
                resultado = sessao.execute(
                    text("INSERT INTO materiais (nome) VALUES (:nome) RETURNING id"),
                    {"nome": linha["material"].strip()},
                )
                material_id = resultado.scalar()
                materiais_existentes[chave_material] = material_id
                materiais_criados.append(linha["material"].strip())
            sets["material_id"] = material_id
            contagem_campo["material_id"] += 1

        if exame.tubo_id is None and linha.get("tubo_recipiente"):
            stem = stem_de(linha["tubo_recipiente"])
            tubo_id = tubo_id_por_stem.get(stem) if stem else None
            if tubo_id is not None:
                sets["tubo_id"] = tubo_id
                tubos_vinculados += 1

        if sets:
            colunas_set = ", ".join(f"{campo} = :{campo}" for campo in sets)
            sets["id"] = exame.id
            sessao.execute(text(f"UPDATE exames SET {colunas_set} WHERE id = :id"), sets)
            exames_atualizados += 1

    sessao.commit()

    print("\n===== Resumo =====")
    print(f"Exames atualizados: {exames_atualizados} de {len(exames)}")
    print(f"Exames sem correspondencia no guia: {len(nao_encontrados)}")
    print(f"Materiais novos criados: {len(materiais_criados)} -> {sorted(set(materiais_criados))}")
    print(f"Tubos vinculados (por cor ja cadastrada): {tubos_vinculados}")
    print("\nCampos preenchidos:")
    for campo in list(CAMPO_PARA_COLUNA_GUIA) + ["material_id"]:
        if contagem_campo[campo]:
            print(f"  {campo}: {contagem_campo[campo]}")

    if campos_grandes_demais:
        print("\nCampos que NAO coube no tamanho da coluna (nao truncados, revisar manualmente):")
        for campo, itens in campos_grandes_demais.items():
            print(f"  {campo} ({len(itens)} exame(s)):")
            for nome, valor in itens[:10]:
                print(f"    - {nome}: {valor[:120]}...")
            if len(itens) > 10:
                print(f"    ... e mais {len(itens) - 10}")

    if nao_encontrados:
        print(f"\nExames cadastrados sem correspondencia exata no guia ({len(nao_encontrados)}):")
        for nome in nao_encontrados[:30]:
            print(f"  - {nome}")
        if len(nao_encontrados) > 30:
            print(f"  ... e mais {len(nao_encontrados) - 30}")

    print("\nLembrete: Codigo TUSS, Setor Responsavel, Tempo Maximo de Envio, Dias de")
    print("Realizacao e Prazo de Liberacao do Resultado continuam vazios -- sao")
    print("especificos do seu fluxo/contrato e nao vem do guia publico.")


if __name__ == "__main__":
    main()
