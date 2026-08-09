from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database.connection import engine
from app.routes import exames, auxiliares, auth, usuarios

app = FastAPI(
    title="Sistema de Consulta de Exames Laboratoriais",
    description="API para consulta, cadastro e gerenciamento de exames laboratoriais",
    version="1.0.0"
)

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

app.include_router(auth.router)
app.include_router(exames.router)
app.include_router(auxiliares.router)
app.include_router(usuarios.router)


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
