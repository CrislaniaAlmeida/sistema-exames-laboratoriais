from pydantic import BaseModel
from typing import Optional


# ---------- Laboratório ----------

class LaboratorioBase(BaseModel):
    nome: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    site: Optional[str] = None


class LaboratorioCriar(LaboratorioBase):
    pass


class LaboratorioAtualizar(LaboratorioBase):
    nome: Optional[str] = None


class LaboratorioResposta(LaboratorioBase):
    id: int

    class Config:
        from_attributes = True


# ---------- Material ----------

class MaterialBase(BaseModel):
    nome: str


class MaterialCriar(MaterialBase):
    pass


class MaterialAtualizar(MaterialBase):
    nome: Optional[str] = None


class MaterialResposta(MaterialBase):
    id: int

    class Config:
        from_attributes = True


# ---------- Tubo ----------

class TuboBase(BaseModel):
    cor: str
    descricao: Optional[str] = None
    foto_url: Optional[str] = None


class TuboCriar(TuboBase):
    pass


class TuboAtualizar(TuboBase):
    cor: Optional[str] = None


class TuboResposta(TuboBase):
    id: int

    class Config:
        from_attributes = True
