# NexLab — Sistema de Consulta de Exames Laboratoriais

Sistema web completo para consulta, cadastro e gerenciamento de exames laboratoriais, desenvolvido para uso em ambiente real de laboratório. Centraliza informações essenciais para a coleta e o envio de amostras — tipo de material, tubo de coleta, volume, preparo do paciente, prazos, método utilizado e laboratório de apoio responsável — eliminando a dependência de planilhas dispersas ou registros em papel.

🔗 **Acesse o sistema ao vivo:** [nextlab-rose.vercel.app](https://nextlab-rose.vercel.app)
🔗 **Documentação da API:** [nexlab-backend.fastapicloud.dev/docs](https://nexlab-backend.fastapicloud.dev/docs)

## Funcionalidades

- **Dashboard** com estatísticas em tempo real (total de exames, laboratórios, materiais e tubos cadastrados) e busca por nome, sigla ou código
- **Página de detalhe por exame**, com edição inline seção por seção: material e coleta, tubo (incluindo foto), preparo do paciente, processamento (interno ou laboratório de apoio) e prazos
- **Controle de laboratórios de apoio**, incluindo acompanhamento de quantidade contratada (anual) e saldo restante por exame terceirizado
- **Cadastro, edição e exclusão** de exames, tubos, materiais e laboratórios (restrito a administradores)
- **Autenticação e controle de acesso** com dois perfis de usuário:
  - **Administrador**: acesso completo (cadastrar, editar, excluir)
  - **Usuário**: acesso somente à consulta
- **Paginação** para navegação fluida mesmo com centenas de exames cadastrados
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

### Infraestrutura e deploy
- **Vercel** — hospedagem do frontend
- **FastAPI Cloud** — hospedagem do backend
- **Neon** — PostgreSQL gerenciado na nuvem

## Modelo de dados

O banco de dados é composto pelas seguintes tabelas principais:

| Tabela | Descrição |
|---|---|
| `exames` | Dados de cada exame (nome, código, material, tubo, preparo, prazo, quantidade contratada/restante, etc.) |
| `usuarios` | Usuários do sistema, com perfil de acesso (admin/usuário) |
| `laboratorios` | Laboratórios de apoio |
| `materiais` | Tipos de material biológico (soro, plasma, urina, etc.) |
| `tubos` | Tipos de tubo de coleta, incluindo foto ilustrativa |
| `exames_relacionados` | Relação entre exames complementares |
| `historico_alteracoes` | Auditoria de alterações realizadas nos exames |

## Como executar o projeto localmente

### Pré-requisitos
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
fastapi dev
```

A API estará disponível em `http://127.0.0.1:8000`, com documentação interativa em `http://127.0.0.1:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### Banco de dados

Configure a variável `DATABASE_URL` em um arquivo `.env` dentro de `backend/`, apontando para uma instância PostgreSQL local ou na nuvem, e execute o script `backend/database/schema.sql` para criar as tabelas.

## Segurança

- Senhas armazenadas exclusivamente como hash (bcrypt), nunca em texto puro
- Autenticação via token JWT com expiração de 8 horas
- Rotas de escrita (criar/editar/excluir) protegidas e restritas a administradores
- Variáveis sensíveis (credenciais de banco, chave secreta) mantidas fora do controle de versão via `.env`

## Roadmap (funcionalidades futuras)

- [ ] Tela de gerenciamento de materiais
- [ ] Geração de PDF com instruções de coleta
- [ ] Histórico de alterações visível na interface
- [ ] Favoritos
- [ ] QR Code para acesso rápido aos exames

## Autora

Desenvolvido por **Crislania Almeida**.