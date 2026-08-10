from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Literal
from datetime import date, datetime

from app.validadores import validar_cpf


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
    complemento: Optional[str] = None
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
    email: Optional[EmailStr] = None

    @field_validator("cpf")
    @classmethod
    def _validar_cpf(cls, valor):
        return validar_cpf(valor)


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
    email: Optional[EmailStr] = None

    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
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


class ExameResumoResposta(BaseModel):
    id: int
    nome: str
    sigla: Optional[str] = None
    codigo: Optional[str] = None
    setor_responsavel: Optional[str] = None
    prazo_liberacao_resultado: Optional[str] = None
    tubo_cor: Optional[str] = None
    material_nome: Optional[str] = None
    laboratorio_nome: Optional[str] = None

    class Config:
        from_attributes = True


class SolicitacaoCriar(BaseModel):
    exame_ids: List[int]


class PacienteResumoResposta(BaseModel):
    codigo: str
    nome: str
    nome_social: Optional[str] = None
    cpf: str
    data_nascimento: date

    class Config:
        from_attributes = True


class ItemExameResposta(BaseModel):
    id: int
    status_resultado: str
    resultado_disponivel_em: Optional[datetime] = None
    exame: Optional[ExameResumoResposta] = None

    class Config:
        from_attributes = True


class AmostraResposta(BaseModel):
    id: int
    codigo: str
    tubo_cor: Optional[str] = None
    material: Optional[str] = None
    setor: Optional[str] = None
    destino: str
    status: str
    coletado_em: Optional[datetime] = None
    criado_em: datetime
    exames: List[ExameResumoResposta]
    itens: List[ItemExameResposta]
    paciente: PacienteResumoResposta

    class Config:
        from_attributes = True


class SolicitacaoResposta(BaseModel):
    id: int
    paciente_id: int
    data_solicitacao: datetime
    exames: List[ExameResumoResposta]
    amostras: List[AmostraResposta]

    class Config:
        from_attributes = True


class AmostraStatusAtualizar(BaseModel):
    status: Literal["aguardando_coleta", "coletado"]


class ItemExameStatusAtualizar(BaseModel):
    status_resultado: Literal["aguardando_resultado", "disponivel"]


class AmostraConsultaResposta(BaseModel):
    """
    Resposta usada tanto pela triagem (bipar o codigo de barras da
    etiqueta identifica o destino e marca a coleta) quanto por uma
    futura integracao com aparelho de setor.
    """
    id: int
    codigo: str
    tubo_cor: Optional[str] = None
    material: Optional[str] = None
    setor: Optional[str] = None
    destino: str
    status: str
    coletado_em: Optional[datetime] = None
    exames: List[ExameResumoResposta]
    paciente: PacienteResumoResposta

    class Config:
        from_attributes = True
