from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Date, ForeignKey, TIMESTAMP, CheckConstraint, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base

PERFIS_VALIDOS = ("admin", "recepcao", "bioquimico", "usuario")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    senha_hash = Column(String(255), nullable=False)
    perfil = Column(String(20), nullable=False, default="usuario")
    permissoes = Column(JSON, nullable=False, default=list)
    deve_trocar_senha = Column(Boolean, nullable=False, default=False)
    ativo = Column(Boolean, nullable=False, default=True)
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())
    atualizado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "perfil IN ('admin', 'recepcao', 'bioquimico', 'usuario')",
            name="check_perfil_valido"),
    )


class Paciente(Base):
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), nullable=False, unique=True, index=True)

    nome = Column(String(150), nullable=False, index=True)
    nome_social = Column(String(150))
    cpf = Column(String(14), nullable=False, unique=True, index=True)
    rg = Column(String(20))
    data_nascimento = Column(Date, nullable=False)
    sexo = Column(String(20))
    nacionalidade = Column(String(100))
    naturalidade = Column(String(100))
    nome_mae = Column(String(150))

    celular = Column(String(20))
    telefone = Column(String(20))
    email = Column(String(150))

    cep = Column(String(10))
    logradouro = Column(String(200))
    numero = Column(String(20))
    complemento = Column(String(100))
    bairro = Column(String(100))
    cidade = Column(String(100))
    estado = Column(String(2))

    cartao_sus = Column(String(20))
    convenio = Column(String(100))
    carteira_convenio = Column(String(50))
    crm_medico_solicitante = Column(String(50))

    toma_medicacao = Column(Boolean, nullable=False, default=False)
    medicamentos = Column(JSON, nullable=False, default=list)
    observacoes_clinicas = Column(Text)

    ativo = Column(Boolean, nullable=False, default=True)
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())
    atualizado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())

    solicitacoes = relationship(
        "Solicitacao", back_populates="paciente", cascade="all, delete-orphan")


class Solicitacao(Base):
    """Um pedido de exames feito para um paciente numa determinada data."""
    __tablename__ = "solicitacoes_exames"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False)
    data_solicitacao = Column(TIMESTAMP(timezone=True), server_default=func.now())

    paciente = relationship("Paciente", back_populates="solicitacoes")
    itens = relationship(
        "SolicitacaoExame", back_populates="solicitacao", cascade="all, delete-orphan")
    amostras = relationship(
        "Amostra", back_populates="solicitacao", cascade="all, delete-orphan")

    @property
    def exames(self):
        return [item.exame for item in self.itens if item.exame]


class Amostra(Base):
    """
    Um tubo/frasco a ser coletado dentro de uma solicitacao -- os exames
    da solicitacao sao agrupados em amostras pelo tubo que usam (ou pelo
    setor, quando o exame ainda nao tem tubo cadastrado). Tem um codigo
    unico e permanente, pensado para virar o codigo de barras lido por
    um aparelho do setor no futuro (hoje nao ha aparelho integrado).
    """
    __tablename__ = "amostras"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), nullable=False, unique=True, index=True)
    solicitacao_id = Column(Integer, ForeignKey(
        "solicitacoes_exames.id", ondelete="CASCADE"), nullable=False)

    tubo_cor = Column(String(50))
    material = Column(String(100))
    setor = Column(String(100))
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())

    solicitacao = relationship("Solicitacao", back_populates="amostras")
    itens = relationship("SolicitacaoExame", back_populates="amostra")

    @property
    def paciente(self):
        return self.solicitacao.paciente if self.solicitacao else None

    @property
    def exames(self):
        return [item.exame for item in self.itens if item.exame]


class SolicitacaoExame(Base):
    """Um exame especifico dentro de uma solicitacao (tabela de ligacao)."""
    __tablename__ = "solicitacao_exames"

    id = Column(Integer, primary_key=True, index=True)
    solicitacao_id = Column(Integer, ForeignKey(
        "solicitacoes_exames.id", ondelete="CASCADE"), nullable=False)
    exame_id = Column(Integer, ForeignKey("exames.id", ondelete="SET NULL"))
    amostra_id = Column(Integer, ForeignKey("amostras.id", ondelete="SET NULL"))

    solicitacao = relationship("Solicitacao", back_populates="itens")
    exame = relationship("Exame")
    amostra = relationship("Amostra", back_populates="itens")


class Laboratorio(Base):
    __tablename__ = "laboratorios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    telefone = Column(String(20))
    email = Column(String(150))
    cidade = Column(String(100))
    estado = Column(String(2))
    site = Column(String(200))
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())

    exames = relationship("Exame", back_populates="laboratorio")


class Material(Base):
    __tablename__ = "materiais"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False, unique=True)

    exames = relationship("Exame", back_populates="material")


class Tubo(Base):
    __tablename__ = "tubos"

    id = Column(Integer, primary_key=True, index=True)
    cor = Column(String(50), nullable=False)
    descricao = Column(String(200))
    foto_url = Column(String(300))

    exames = relationship("Exame", back_populates="tubo")


class Exame(Base):
    __tablename__ = "exames"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False, index=True)
    sigla = Column(String(30), index=True)
    codigo = Column(String(30), index=True)

    laboratorio_id = Column(Integer, ForeignKey(
        "laboratorios.id", ondelete="SET NULL"))
    setor_responsavel = Column(String(100))
    material_id = Column(Integer, ForeignKey(
        "materiais.id", ondelete="SET NULL"))
    tubo_id = Column(Integer, ForeignKey("tubos.id", ondelete="SET NULL"))

    volume_minimo = Column(String(50))
    volume_ideal = Column(String(50))
    jejum_necessario = Column(String(100))
    preparo_paciente = Column(Text)
    forma_coleta = Column(Text)
    temperatura_armazenamento = Column(String(100))
    tempo_maximo_envio = Column(String(100))
    dias_realizacao = Column(String(200))
    prazo_liberacao_resultado = Column(String(100))
    metodo_utilizado = Column(String(150))
    observacoes = Column(Text)
    quantidade_contratada = Column(Integer)
    quantidade_restante = Column(Integer)
    ativo = Column(Boolean, nullable=False, default=True)

    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())
    atualizado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())

    laboratorio = relationship("Laboratorio", back_populates="exames")
    material = relationship("Material", back_populates="exames")
    tubo = relationship("Tubo", back_populates="exames")

    @property
    def tubo_cor(self):
        return self.tubo.cor if self.tubo else None

    @property
    def material_nome(self):
        return self.material.nome if self.material else None
