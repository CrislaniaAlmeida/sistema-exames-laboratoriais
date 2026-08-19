from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
url = os.getenv("DATABASE_URL_PRODUCAO")

engine = create_engine(url)
with engine.connect() as conn:
    total = conn.execute(text("SELECT COUNT(*) FROM exames")).scalar()
    com_horas = conn.execute(text(
        "SELECT COUNT(*) FROM exames WHERE prazo_liberacao_horas IS NOT NULL"
    )).scalar()
    print("total de exames:", total)
    print("exames com prazo_liberacao_horas preenchido:", com_horas)

    print()
    print("Exames pendentes de liberacao e seu prazo_liberacao_horas:")
    rows = conn.execute(text("""
        SELECT e.nome, e.prazo_liberacao_horas, a.id AS amostra_id, a.status AS amostra_status, a.recebido_em
        FROM solicitacao_exames se
        JOIN exames e ON e.id = se.exame_id
        LEFT JOIN amostras a ON a.id = se.amostra_id
        WHERE se.status_resultado IN ('aguardando_resultado', 'aguardando_confirmacao')
          AND e.laboratorio_id IS NULL
    """)).fetchall()
    for r in rows:
        print(r)
