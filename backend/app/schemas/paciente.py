from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class PacienteBase(BaseModel):
    nome: str
    nome_social: Optional[str] = None
    cpf: str
    rg: Optional[str] = None
    data_nascimento: date
    sexo: Optional[str] = None
    nacionalidade: Optional[str] = None
    naturalidade: Optional[str] = None
    nome_mae: Optional[str] = None

    celular: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None

    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None

    cartao_sus: Optional[str] = None
    convenio: Optional[str] = None
    carteira_convenio: Optional[str] = None
    crm_medico_solicitante: Optional[str] = None

    toma_medicacao: bool = False
    medicamentos: List[str] = []
    observacoes_clinicas: Optional[str] = None


class PacienteCriar(PacienteBase):
    pass


class PacienteAtualizar(BaseModel):
    nome: Optional[str] = None
    nome_social: Optional[str] = None
    cpf: Optional[str] = None
    rg: Optional[str] = None
    data_nascimento: Optional[date] = None
    sexo: Optional[str] = None
    nacionalidade: Optional[str] = None
    naturalidade: Optional[str] = None
    nome_mae: Optional[str] = None

    celular: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None

    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None

    cartao_sus: Optional[str] = None
    convenio: Optional[str] = None
    carteira_convenio: Optional[str] = None
    crm_medico_solicitante: Optional[str] = None

    toma_medicacao: Optional[bool] = None
    medicamentos: Optional[List[str]] = None
    observacoes_clinicas: Optional[str] = None
    ativo: Optional[bool] = None


class PacienteResposta(PacienteBase):
    id: int
    codigo: str
    ativo: bool
    criado_em: datetime

    class Config:
        from_attributes = True
