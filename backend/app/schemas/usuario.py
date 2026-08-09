from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

PERMISSOES_DISPONIVEIS = {
    "exames_gerenciar": "Cadastrar e editar exames",
    "tubos_gerenciar": "Cadastrar e editar tubos",
    "laboratorios_gerenciar": "Cadastrar e editar laboratorios",
    "pacientes_gerenciar": "Cadastrar e editar pacientes",
}

PERFIS_DISPONIVEIS = {
    "admin": "Administrador",
    "recepcao": "Recepcao / Coletador",
    "bioquimico": "Bioquimico",
    "usuario": "Outro",
}


class UsuarioCriar(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    perfil: str = "usuario"
    permissoes: List[str] = []


class UsuarioAtualizar(BaseModel):
    nome: Optional[str] = None
    senha: Optional[str] = None
    perfil: Optional[str] = None
    permissoes: Optional[List[str]] = None
    ativo: Optional[bool] = None


class UsuarioResposta(BaseModel):
    id: int
    nome: str
    email: EmailStr
    perfil: str
    permissoes: List[str] = []
    deve_trocar_senha: bool
    ativo: bool
    criado_em: datetime

    class Config:
        from_attributes = True


class LoginDados(BaseModel):
    email: EmailStr
    senha: str


class TrocarSenhaDados(BaseModel):
    senha_nova: str


class TokenResposta(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioResposta
