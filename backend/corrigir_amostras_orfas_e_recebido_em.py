"""
Script de correcao pontual (idempotente) para dois problemas encontrados
em producao em 19/08:

1. Itens de solicitacao antigos (de 09/08, antes da geracao automatica
   de amostra por solicitacao existir) ficaram sem nenhuma amostra
   vinculada -- por isso nunca aparecem na Triagem nem na Liberacao de
   Exames. Aqui sao agrupados em amostras novas, do mesmo jeito que
   criar_solicitacao() faria hoje.

2. Duas amostras foram coletadas em 11/08, um dia antes da correcao do
   bug do "tubo misto" (Amostra.possui_exame_interno) ser publicada, e
   ficaram com recebido_em vazio para sempre. Aqui o valor e' preenchido
   retroativamente com a data da coleta.

Rodar uma vez com DATABASE_URL_PRODUCAO. Rodar de novo depois nao faz
nada (nenhum item/amostra mais se enquadra nos filtros).
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

from app.database.models import Amostra, SolicitacaoExame, Exame
from app.services.paciente_service import gerar_codigo_amostra, _chave_grupo_amostra

engine = create_engine(os.getenv("DATABASE_URL_PRODUCAO"))
Sessao = sessionmaker(bind=engine)
db = Sessao()

# --- 1. Itens sem amostra vinculada -----------------------------------
itens_orfaos = (
    db.query(SolicitacaoExame)
    .filter(SolicitacaoExame.amostra_id.is_(None))
    .filter(SolicitacaoExame.status_resultado.in_(["aguardando_resultado", "aguardando_confirmacao"]))
    .all()
)

grupos = {}
for item in itens_orfaos:
    exame = db.query(Exame).filter(Exame.id == item.exame_id).first()
    if not exame:
        continue
    chave = (item.solicitacao_id, _chave_grupo_amostra(exame))
    grupos.setdefault(chave, {
        "tubo_cor": exame.tubo_cor,
        "material": exame.material_nome,
        "setor": exame.setor_responsavel,
        "itens": [],
    })
    grupos[chave]["itens"].append(item)

for (solicitacao_id, _), grupo in grupos.items():
    amostra = Amostra(
        codigo=gerar_codigo_amostra(db),
        solicitacao_id=solicitacao_id,
        tubo_cor=grupo["tubo_cor"],
        material=grupo["material"],
        setor=grupo["setor"],
    )
    db.add(amostra)
    db.flush()
    for item in grupo["itens"]:
        item.amostra_id = amostra.id
    print(f"Criada amostra {amostra.codigo} para solicitacao {solicitacao_id} ({len(grupo['itens'])} exame(s))")

db.commit()

# --- 2. Amostras coletadas sem recebido_em (bug do tubo misto, pre-fix) --
amostras_travadas = (
    db.query(Amostra)
    .filter(Amostra.status == "coletado")
    .filter(Amostra.recebido_em.is_(None))
    .filter(Amostra.coletado_em.is_not(None))
    .all()
)

for amostra in amostras_travadas:
    if amostra.possui_exame_interno:
        amostra.recebido_em = amostra.coletado_em
        print(f"Amostra {amostra.codigo}: recebido_em preenchido com {amostra.coletado_em}")

db.commit()

print("Correcao concluida.")
