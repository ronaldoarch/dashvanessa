# Guia de Setup - Painel de Afiliados

## 🚀 Início Rápido

### 1. Pré-requisitos

Certifique-se de ter instalado:
- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 14+ ou Docker
- npm ou yarn

### 2. Configuração do Banco de Dados

#### Opção A: Usando Docker (Recomendado)

**Nota**: Se você receber "command not found", veja a seção "Sem Docker" abaixo.

```bash
# Versão nova do Docker (sem hífen)
docker compose up -d

# Ou versão antiga (com hífen)
docker-compose up -d
```

Isso criará um container PostgreSQL na porta 5432.

#### Opção B: PostgreSQL Local (Sem Docker)

Se não tiver Docker instalado, veja o arquivo `SETUP_WITHOUT_DOCKER.md` para instruções detalhadas.

**Resumo rápido com Homebrew:**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb affiliate_db
```

#### Opção B: PostgreSQL Local

Crie um banco de dados PostgreSQL:

```sql
CREATE DATABASE affiliate_db;
CREATE USER affiliate_user WITH PASSWORD 'affiliate_password';
GRANT ALL PRIVILEGES ON DATABASE affiliate_db TO affiliate_user;
```

### 3. Configuração do Backend

```bash
cd backend
npm install
```

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
DATABASE_URL="postgresql://affiliate_user:affiliate_password@localhost:5432/affiliate_db?schema=public"
JWT_SECRET="sua-chave-secreta-muito-segura-aqui"
OTG_API_KEY="pk_sua_chave_otg_aqui"
```

Execute as migrações do Prisma:

```bash
npx prisma generate
npx prisma migrate dev
```

Execute o seed para criar o usuário admin:

```bash
npm run seed
```

Isso criará:
- Usuário admin: `admin@example.com` / `admin123`
- Configurações padrão (CPA: R$ 300, Revenue Share: 25%)

Inicie o servidor:

```bash
npm run dev
```

O backend estará rodando em `http://localhost:3001`

### 4. Configuração do Frontend

```bash
cd frontend
npm install
```

Copie o arquivo `.env.local.example` para `.env.local`:

```bash
cp .env.local.example .env.local
```

Edite o `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

### 5. Acessar o Sistema

1. Acesse `http://localhost:3000`
2. Faça login com:
   - Email: `admin@example.com`
   - Senha: `admin123`

## 🔧 Configurações Avançadas

### Alterar Valores de CPA e Revenue Share

Como administrador, você pode alterar os valores via API:

```bash
curl -X PUT http://localhost:3001/api/config \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "cpaValue": 350,
    "revSharePercentage": 30
  }'
```

Ou via interface do dashboard (se implementado).

### Sincronização Automática

Os cron jobs estão configurados para:
- **Sincronizar afiliados**: A cada hora
- **Sincronizar resultados**: A cada 5 minutos

Para testar manualmente, você pode chamar os métodos diretamente no código ou criar endpoints administrativos.

### Criar Novo Usuário Afiliado

Como admin, você pode criar novos usuários via API:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "afiliado@example.com",
    "password": "senha123",
    "name": "Afiliado Teste",
    "role": "AFFILIATE"
  }'
```

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

1. Verifique se o PostgreSQL está rodando
2. Verifique as credenciais no `.env`
3. Teste a conexão: `psql -U affiliate_user -d affiliate_db`

### Erro: "JWT_SECRET não configurado"

Certifique-se de que o `.env` tem a variável `JWT_SECRET` definida.

### Erro: "OTG API Key inválida"

Verifique se a `OTG_API_KEY` está correta no `.env`. A sincronização não funcionará sem uma chave válida.

### Erro de migração do Prisma

Se houver problemas com migrações:

```bash
npx prisma migrate reset  # CUIDADO: Apaga todos os dados
npx prisma migrate dev
npm run seed
```

## 📊 Estrutura do Banco de Dados

Para visualizar o banco de dados:

```bash
cd backend
npx prisma studio
```

Isso abrirá uma interface web em `http://localhost:5555` para visualizar e editar os dados.

## 🔐 Segurança

⚠️ **IMPORTANTE**: Em produção:

1. Altere todas as senhas padrão
2. Use um `JWT_SECRET` forte e único
3. Configure HTTPS
4. Use variáveis de ambiente seguras
5. Configure rate limiting
6. Implemente logs de auditoria
7. Faça backup regular do banco de dados

## 📝 Próximos Passos

1. Configure a API key da OTG Partners
2. Ajuste os valores de CPA e Revenue Share conforme necessário
3. Crie usuários para seus afiliados
4. Monitore a sincronização automática
5. Personalize o dashboard conforme necessário
