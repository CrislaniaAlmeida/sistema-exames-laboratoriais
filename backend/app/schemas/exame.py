from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ExameBase(BaseModel):
    nome: str
    sigla: Optional[str] = None
    codigo: Optional[str] = None
    laboratorio_id: Optional[int] = None
    setor_responsavel: Optional[str] = None
    material_id: Optional[int] = None
    tubo_id: Optional[int] = None
    volume_minimo: Optional[str] = None
    volume_ideal: Optional[str] = None
    jejum_necessario: Optional[str] = None
    preparo_paciente: Optional[str] = None
    forma_coleta: Optional[str] = None
    temperatura_armazenamento: Optional[str] = None
    tempo_maximo_envio: Optional[str] = None
    dias_realizacao: Optional[str] = None
    prazo_liberacao_resultado: Optional[str] = None
    prazo_liberacao_horas: Optional[float] = None
    equipamento: Optional[str] = None
    metodo_utilizado: Optional[str] = None
    observacoes: Optional[str] = None
    quantidade_contratada: Optional[int] = None
    quantidade_restante: Optional[int] = None
    unidade_resultado: Optional[str] = None
    valor_referencia_min: Optional[float] = None
    valor_referencia_max: Optional[float] = None
    valor_referencia_texto: Optional[str] = None


class ExameCriar(ExameBase):
    """Usado quando um novo exame é cadastrado."""
    pass


class ExameAtualizar(ExameBase):
    """
    Usado na edição. Todos os campos são opcionais aqui, porque 
    o usuário pode querer atualizar só um campo especifico. 
    """
    nome: Optional[str] = None


class ExameResposta(ExameBase):
    """Usado quando a API devolve os dados de um exame."""
    id: int
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime

    class Config:
        from_attributes = True
