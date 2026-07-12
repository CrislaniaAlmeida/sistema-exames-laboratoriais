# Sistema de Consulta de Exames Laboratoriais

Sistema web completo para consulta, cadastro e gerenciamento de exames laboratoriais, desenvolvido para uso em ambiente real de laboratório. Centraliza informações essenciais para a coleta e o envio de amostras — tipo de material, tubo de coleta, volume, preparo do paciente, prazos e método utilizado — eliminando a dependência de planilhas dispersas ou registros em papel.

## Funcionalidades

- **Consulta de exames** por nome, sigla, código ou material, com todas as informações necessárias para a coleta exibidas de forma centralizada
- **Cadastro, edição e exclusão** de exames (restrito a administradores)
- **Gerenciamento de dados auxiliares**: laboratórios de apoio, tipos de material e tubos de coleta
- **Autenticação e controle de acesso** com dois perfis de usuário:
  - **Administrador**: acesso completo (cadastrar, editar, excluir, gerenciar usuários)
  - **Usuário**: acesso somente à consulta
- **Exclusão lógica de exames**, preservando o histórico e evitando perda de dados por engano
- **Senhas criptografadas** (bcrypt) e autenticação via **token JWT**

## Tecnologias utilizadas

### Backend
- **Python 3.14** + **FastAPI** — API REST
- **SQLAlchemy** — ORM
- **PostgreSQL** — banco de dados relacional
- **Pydantic** — validação de dados
- **python-jose** + **passlib (bcrypt)** — autenticação e criptografia de senha
- **Uvicorn** — servidor ASGI

### Frontend
- **React** (com **Vite**)
- **React Router DOM** — navegação entre páginas
- **Axios** — comunicação com a API
- **Context API** — gerenciamento de estado de autenticação

## Modelo de dados

O banco de dados é composto pelas seguintes tabelas principais:

| Tabela | Descrição |
|---|---|
| `exames` | Dados de cada exame (nome, código, material, tubo, preparo, prazo, etc.) |
| `usuarios` | Usuários do sistema, com perfil de acesso (admin/usuário) |
| `laboratorios` | Laboratórios de apoio |
| `materiais` | Tipos de material biológico (soro, plasma, urina, etc.) |
| `tubos` | Tipos de tubo de coleta |
| `exames_relacionados` | Relação entre exames complementares |
| `historico_alteracoes` | Auditoria de alterações realizadas nos exames |

## Como executar o projeto localmente

### Pré-requisitos
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend

A API estará disponível em `http://127.0.0.1:8000`, com documentação interativa em `http://127.0.0.1:8000/docs`.

### Frontend

A aplicação estará disponível em `http://localhost:5173`.

### Banco de dados

## Segurança

- Senhas armazenadas exclusivamente como hash (bcrypt), nunca em texto puro
- Autenticação via token JWT com expiração de 8 horas
- Rotas de escrita (criar/editar/excluir) protegidas e restritas a administradores
- Variáveis sensíveis (credenciais de banco, chave secreta) mantidas fora do controle de versão via `.env`

## Roadmap (funcionalidades futuras)

- [ ] Fotos dos tubos de coleta
- [ ] Geração de PDF com instruções de coleta
- [ ] Histórico de alterações visível na interface
- [ ] Favoritos
- [ ] QR Code para acesso rápido aos exames
- [ ] Dashboard com indicadores de exames cadastrados

## Autora

Desenvolvido por **Crislania Almeida**.