# Setup sem Docker - PostgreSQL Local

Como o Docker não está instalado, vamos configurar o PostgreSQL localmente.

## 📋 Opção 1: Instalar PostgreSQL no macOS

### Usando Homebrew (Recomendado)

```bash
# Instalar Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar PostgreSQL
brew install postgresql@15

# Iniciar PostgreSQL
brew services start postgresql@15

# Criar banco de dados
createdb affiliate_db

# Criar usuário (opcional, pode usar seu usuário atual)
psql postgres
```

No psql:
```sql
CREATE USER affiliate_user WITH PASSWORD 'affiliate_password';
CREATE DATABASE affiliate_db OWNER affiliate_user;
GRANT ALL PRIVILEGES ON DATABASE affiliate_db TO affiliate_user;
\q
```

### Usando Postgres.app (Interface Gráfica)

1. Baixe em: https://postgresapp.com/
2. Instale e abra o app
3. Clique em "Initialize" para criar um servidor
4. Use o terminal integrado ou configure manualmente

## 📋 Opção 2: Instalar Docker Desktop

Se preferir usar Docker:

1. Baixe Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Instale e inicie o Docker Desktop
3. Use o comando (versão nova usa `docker compose` sem hífen):

```bash
docker compose up -d
```

Ou se sua versão for antiga:

```bash
docker-compose up -d
```

## ⚙️ Configuração do Backend

Depois de ter o PostgreSQL rodando, configure o `.env` do backend:

```env
# Se usar PostgreSQL local padrão
DATABASE_URL="postgresql://seu_usuario@localhost:5432/affiliate_db?schema=public"

# Se criou usuário específico
DATABASE_URL="postgresql://affiliate_user:affiliate_password@localhost:5432/affiliate_db?schema=public"

# Se usar Postgres.app (porta padrão pode ser diferente)
DATABASE_URL="postgresql://postgres@localhost:5432/affiliate_db?schema=public"
```

## 🚀 Continuar Setup

Depois de configurar o PostgreSQL:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

## ✅ Verificar Conexão

Teste se o PostgreSQL está acessível:

```bash
psql -d affiliate_db -c "SELECT version();"
```

Se funcionar, você verá a versão do PostgreSQL.
