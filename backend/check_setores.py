from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
url = os.getenv("DATABASE_URL_PRODUCAO")

engine = create_engine(url)
with engine.connect() as conn:
    rows = conn.execute(text("""
        SELECT e.setor_responsavel, e.nome, a.status AS amostra_status, a.recebido_em, se.status_resultado
        FROM solicitacao_exames se
        JOIN exames e ON e.id = se.exame_id
        LEFT JOIN amostras a ON a.id = se.amostra_id
        WHERE se.status_resultado IN ('aguardando_resultado', 'aguardando_confirmacao')
          AND e.laboratorio_id IS NULL
        ORDER BY e.setor_responsavel
    """)).fetchall()
    for r in rows:
        print(r)
