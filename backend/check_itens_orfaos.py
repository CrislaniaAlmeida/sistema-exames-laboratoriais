from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
url = os.getenv("DATABASE_URL_PRODUCAO")

engine = create_engine(url)
with engine.connect() as conn:
    rows = conn.execute(text("""
        SELECT se.id AS item_id, e.nome AS exame, p.nome AS paciente, p.codigo, s.data_solicitacao
        FROM solicitacao_exames se
        JOIN exames e ON e.id = se.exame_id
        JOIN solicitacoes_exames s ON s.id = se.solicitacao_id
        JOIN pacientes p ON p.id = s.paciente_id
        WHERE se.amostra_id IS NULL
          AND se.status_resultado IN ('aguardando_resultado', 'aguardando_confirmacao')
        ORDER BY s.data_solicitacao
    """)).fetchall()
    for r in rows:
        print(r)
