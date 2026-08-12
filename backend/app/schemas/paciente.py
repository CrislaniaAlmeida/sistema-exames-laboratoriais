from pydantic import BaseModel, EmailStr, Field, field_validator
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
    prazo_liberacao_horas: Optional[float] = None
    equipamento: Optional[str] = None
    tubo_cor: Optional[str] = None
    material_nome: Optional[str] = None
    laboratorio_nome: Optional[str] = None
    metodo_utilizado: Optional[str] = None
    unidade_resultado: Optional[str] = None
    valor_referencia_min: Optional[float] = None
    valor_referencia_max: Optional[float] = None
    valor_referencia_texto: Optional[str] = None

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
    sexo: Optional[str] = None

    class Config:
        from_attributes = True


class PacienteAtendimentoResposta(BaseModel):
    codigo: str
    nome: str
    convenio: Optional[str] = None

    class Config:
        from_attributes = True


class AtendimentoResposta(BaseModel):
    id: int
    data_solicitacao: datetime
    paciente: PacienteAtendimentoResposta
    exames: List[ExameResumoResposta]

    class Config:
        from_attributes = True


class ItemExameResposta(BaseModel):
    id: int
    status_resultado: str
    resultado_disponivel_em: Optional[datetime] = None
    valor_resultado: Optional[str] = None
    unidade_resultado: Optional[str] = None
    flag_resultado: Optional[str] = None
    observacoes_resultado: Optional[str] = None
    liberado_por_nome: Optional[str] = None
    lancado_por_nome: Optional[str] = None
    lancado_em: Optional[datetime] = None
    exame: Optional[ExameResumoResposta] = None

    class Config:
        from_attributes = True


class ResultadoLancar(BaseModel):
    valor_resultado: str = Field(min_length=1)
    observacoes_resultado: Optional[str] = None


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
    token_publico: Optional[str] = None
    token_publico_expira_em: Optional[datetime] = None
    token_expirado: bool = False
    exames: List[ExameResumoResposta]
    amostras: List[AmostraResposta]

    class Config:
        from_attributes = True


class PortalPacienteResposta(BaseModel):
    codigo: str
    nome: str
    cpf: str
    data_nascimento: date
    crm_medico_solicitante: Optional[str] = None

    class Config:
        from_attributes = True


class PortalResposta(BaseModel):
    """Resposta publica (sem autenticacao) do portal do paciente, acessada pelo link unico do laudo."""
    paciente: PortalPacienteResposta
    solicitacao: SolicitacaoResposta


class AmostraLiberacaoResposta(BaseModel):
    id: int
    codigo: str
    tubo_cor: Optional[str] = None
    material: Optional[str] = None
    coletado_em: Optional[datetime] = None
    recebido_em: Optional[datetime] = None

    class Config:
        from_attributes = True


class ItemLiberacaoResposta(BaseModel):
    id: int
    status_resultado: str
    valor_resultado: Optional[str] = None
    unidade_resultado: Optional[str] = None
    observacoes_resultado: Optional[str] = None
    lancado_por_nome: Optional[str] = None
    lancado_em: Optional[datetime] = None
    prazo_limite: Optional[datetime] = None
    prazo_status: Literal["atrasado", "proximo_do_limite", "no_prazo", "sem_prazo"]
    exame: Optional[ExameResumoResposta] = None
    amostra: Optional[AmostraLiberacaoResposta] = None
    paciente: Optional[PacienteResumoResposta] = None

    class Config:
        from_attributes = True


class AmostraStatusAtualizar(BaseModel):
    status: Literal["aguardando_coleta", "coletado"]


class ItemExameStatusAtualizar(BaseModel):
    status_resultado: Literal["aguardando_resultado", "aguardando_confirmacao", "disponivel"]


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


class LogAuditoriaResposta(BaseModel):
    """Um registro da trilha de auditoria (LGPD): quem acessou/alterou o que, e quando."""
    id: int
    usuario_nome: Optional[str] = None
    metodo: str
    caminho: str
    status_code: int
    ip: Optional[str] = None
    criado_em: datetime

    class Config:
        from_attributes = True
