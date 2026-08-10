-- =========================================================
-- Sistema de Consulta de Exames Laboratoriais
-- Script de criação do banco de dados
-- Banco: PostgreSQL 18
-- =========================================================

-- Cria o banco de dados (rode esta linha separadamente, fora
-- de uma transação, conectado ao banco padrão "postgres")
-- CREATE DATABASE exames_db;

-- Depois de criar o banco, conecte-se a ele (\c exames_db no psql,
-- ou selecione "exames_db" no pgAdmin) e rode o restante do script.

-- ---------------------------------------------------------
-- Extensão para gerar timestamps automáticos com fuso horário
-- ---------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- TABELA: usuarios
-- =========================================================
CREATE TABLE usuarios (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    senha_hash      VARCHAR(255) NOT NULL,
    perfil          VARCHAR(20)  NOT NULL DEFAULT 'usuario'
                        CONSTRAINT check_perfil_valido
                        CHECK (perfil IN ('admin', 'recepcao', 'coletador', 'bioquimico', 'usuario')),
    permissoes      JSONB        NOT NULL DEFAULT '[]'::jsonb,
    deve_trocar_senha BOOLEAN    NOT NULL DEFAULT FALSE,
    ativo           BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE usuarios IS 'Usuários do sistema. Perfil "admin" tem acesso total; os demais tem acesso definido pela coluna permissoes (ex: exames_gerenciar, tubos_gerenciar, laboratorios_gerenciar)';

-- =========================================================
-- TABELA: pacientes (cadastro feito pela recepcao/coleta)
-- =========================================================
CREATE TABLE pacientes (
    id                      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo                  VARCHAR(20)  NOT NULL UNIQUE,

    nome                    VARCHAR(150) NOT NULL,
    nome_social             VARCHAR(150),
    cpf                     VARCHAR(14)  NOT NULL UNIQUE,
    rg                      VARCHAR(20),
    data_nascimento         DATE         NOT NULL,
    sexo                    VARCHAR(20),
    nacionalidade           VARCHAR(100),
    naturalidade            VARCHAR(100),
    nome_mae                VARCHAR(150),

    celular                 VARCHAR(20),
    telefone                VARCHAR(20),
    email                   VARCHAR(150),

    cep                     VARCHAR(10),
    logradouro              VARCHAR(200),
    numero                  VARCHAR(20),
    complemento             VARCHAR(100),
    bairro                  VARCHAR(100),
    cidade                  VARCHAR(100),
    estado                  CHAR(2),

    cartao_sus              VARCHAR(20),
    convenio                VARCHAR(100),
    carteira_convenio       VARCHAR(50),
    crm_medico_solicitante  VARCHAR(50),

    toma_medicacao          BOOLEAN      NOT NULL DEFAULT FALSE,
    medicamentos            JSONB        NOT NULL DEFAULT '[]'::jsonb,
    observacoes_clinicas    TEXT,

    ativo                   BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_pacientes_nome   ON pacientes (nome);
CREATE INDEX idx_pacientes_cpf    ON pacientes (cpf);
CREATE INDEX idx_pacientes_codigo ON pacientes (codigo);

-- =========================================================
-- TABELA: laboratorios (laboratório de apoio)
-- =========================================================
CREATE TABLE laboratorios (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome            VARCHAR(150) NOT NULL,
    telefone        VARCHAR(20),
    email           VARCHAR(150),
    cidade          VARCHAR(100),
    estado          CHAR(2),
    site            VARCHAR(200),
    criado_em       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- =========================================================
-- TABELA: materiais (Soro, Plasma, Urina, Fezes...)
-- =========================================================
CREATE TABLE materiais (
    id      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome    VARCHAR(100) NOT NULL UNIQUE
);

-- =========================================================
-- TABELA: tubos (tipo de tubo de coleta)
-- =========================================================
CREATE TABLE tubos (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cor         VARCHAR(50) NOT NULL,
    descricao   VARCHAR(200),
    foto_url    VARCHAR(300)
);

-- =========================================================
-- TABELA: exames (tabela principal)
-- =========================================================
CREATE TABLE exames (
    id                          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome                        VARCHAR(200) NOT NULL,
    sigla                       VARCHAR(30),
    codigo                      VARCHAR(30),
    laboratorio_id              INTEGER REFERENCES laboratorios(id) ON DELETE SET NULL,
    setor_responsavel           VARCHAR(100),
    material_id                 INTEGER REFERENCES materiais(id) ON DELETE SET NULL,
    tubo_id                     INTEGER REFERENCES tubos(id) ON DELETE SET NULL,
    volume_minimo               VARCHAR(50),
    volume_ideal                VARCHAR(50),
    jejum_necessario            VARCHAR(100),
    preparo_paciente            TEXT,
    forma_coleta                TEXT,
    temperatura_armazenamento   VARCHAR(100),
    tempo_maximo_envio          VARCHAR(100),
    dias_realizacao             VARCHAR(200),
    prazo_liberacao_resultado   VARCHAR(100),
    metodo_utilizado            VARCHAR(150),
    observacoes                 TEXT,
    ativo                        BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em                TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE exames IS 'Tabela principal com todas as informações de cada exame laboratorial';

-- =========================================================
-- TABELA: solicitacoes_exames (pedido de exames de um paciente)
-- =========================================================
CREATE TABLE solicitacoes_exames (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    paciente_id         INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    data_solicitacao    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE amostras (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo              VARCHAR(20)  NOT NULL UNIQUE,
    solicitacao_id      INTEGER NOT NULL REFERENCES solicitacoes_exames(id) ON DELETE CASCADE,
    tubo_cor            VARCHAR(50),
    material            VARCHAR(100),
    setor               VARCHAR(100),
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE solicitacao_exames (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitacao_id      INTEGER NOT NULL REFERENCES solicitacoes_exames(id) ON DELETE CASCADE,
    exame_id            INTEGER REFERENCES exames(id) ON DELETE SET NULL,
    amostra_id          INTEGER REFERENCES amostras(id) ON DELETE SET NULL
);

CREATE INDEX idx_solicitacoes_paciente ON solicitacoes_exames (paciente_id);
CREATE INDEX idx_solicitacao_exames_solicitacao ON solicitacao_exames (solicitacao_id);
CREATE INDEX idx_amostras_codigo ON amostras (codigo);
CREATE INDEX idx_amostras_solicitacao ON amostras (solicitacao_id);

-- =========================================================
-- TABELA: exames_relacionados (relação N:N entre exames)
-- =========================================================
CREATE TABLE exames_relacionados (
    exame_id             INTEGER NOT NULL REFERENCES exames(id) ON DELETE CASCADE,
    exame_relacionado_id INTEGER NOT NULL REFERENCES exames(id) ON DELETE CASCADE,
    PRIMARY KEY (exame_id, exame_relacionado_id),
    CHECK (exame_id <> exame_relacionado_id)
);

-- =========================================================
-- TABELA: historico_alteracoes (auditoria - recurso futuro,
-- mas já deixamos a estrutura pronta desde o início)
-- =========================================================
CREATE TABLE historico_alteracoes (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    exame_id        INTEGER REFERENCES exames(id) ON DELETE CASCADE,
    usuario_id      INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    acao            VARCHAR(20) NOT NULL CHECK (acao IN ('criacao', 'edicao', 'exclusao')),
    detalhes        JSONB,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- ÍNDICES para busca rápida (pesquisa por nome, sigla, código)
-- =========================================================
CREATE INDEX idx_exames_nome     ON exames USING GIN (to_tsvector('portuguese', nome));
CREATE INDEX idx_exames_sigla    ON exames (sigla);
CREATE INDEX idx_exames_codigo   ON exames (codigo);
CREATE INDEX idx_exames_material ON exames (material_id);
CREATE INDEX idx_exames_laboratorio ON exames (laboratorio_id);

-- =========================================================
-- TRIGGER: atualizar automaticamente "atualizado_em"
-- sempre que um exame for editado
-- =========================================================
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_exames_atualizado_em
BEFORE UPDATE ON exames
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_usuarios_atualizado_em
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

-- =========================================================
-- DADOS INICIAIS (seed) - alguns materiais e tubos comuns
-- =========================================================
INSERT INTO materiais (nome) VALUES
    ('Soro'), ('Plasma'), ('Sangue Total'), ('Urina'), ('Fezes'), ('Saliva');

INSERT INTO tubos (cor, descricao) VALUES
    ('Amarelo', 'Gel Separador - Soro'),
    ('Roxo', 'EDTA - Hematologia'),
    ('Azul', 'Citrato de Sódio - Coagulação'),
    ('Cinza', 'Fluoreto de Sódio - Glicose'),
    ('Vermelho', 'Sem gel - Soro');

-- =========================================================
-- Fim do script
-- =========================================================
