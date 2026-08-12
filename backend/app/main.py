from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from app.database.connection import engine
from app.limiter import limiter
from app.middlewares.auditoria import middleware_auditoria
from app.routes import exames, auxiliares, auth, usuarios, pacientes, amostras, relatorios, portal

app = FastAPI(
    title="Sistema de Consulta de Exames Laboratoriais",
    description="API para consulta, cadastro e gerenciamento de exames laboratoriais",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://nextlab-rose.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(middleware_auditoria)

app.include_router(auth.router)
app.include_router(exames.router)
app.include_router(auxiliares.router)
app.include_router(usuarios.router)
app.include_router(pacientes.router)
app.include_router(amostras.router)
app.include_router(relatorios.router)
app.include_router(portal.router)


@app.get("/")
def raiz():
    return {"mensagem": "API do Sistema de Exames esta funcionando!"}


@app.get("/testar-conexao")
def testar_conexao():
    try:
        with engine.connect() as conexao:
            conexao.execute(text("SELECT 1"))
        return {"status": "sucesso", "mensagem": "Conexao com o banco de dados funcionando!"}
    except Exception as erro:
        return {"status": "erro", "mensagem": str(erro)}
