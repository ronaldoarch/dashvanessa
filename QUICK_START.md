# 🚀 Início Rápido - Sem Docker

Você tem PostgreSQL instalado! Vamos configurar rapidamente:

## 1️⃣ Criar Banco de Dados

```bash
# Criar banco de dados
createdb affiliate_db

# Verificar se foi criado
psql -l | grep affiliate_db
```

## 2️⃣ Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar arquivo .env
cat > .env << 'EOF'
DATABASE_URL="postgresql://$(whoami)@localhost:5432/affiliate_db?schema=public"
JWT_SECRET="sua-chave-secreta-muito-segura-mude-em-producao-$(openssl rand -hex 32)"
JWT_EXPIRES_IN="7d"
OTG_API_KEY="pk_sua_chave_otg_aqui"
OTG_API_BASE_URL="https://api-partners.grupootg.com/api/v1"
PORT=3001
NODE_ENV=development
DEFAULT_CPA_VALUE=300
DEFAULT_REVENUE_SHARE_PERCENTAGE=25
EOF

# Ajustar DATABASE_URL com seu usuário
# Edite o .env e substitua $(whoami) pelo seu usuário do PostgreSQL
# Ou use: postgresql://postgres@localhost:5432/affiliate_db
```

## 3️⃣ Configurar Banco de Dados

```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev --name init

# Criar usuário admin e configurações
npm run seed
```

## 4️⃣ Configurar Frontend

```bash
cd ../frontend

# Instalar dependências
npm install

# Criar arquivo .env.local
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001/api' > .env.local
```

## 5️⃣ Iniciar Servidores

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 6️⃣ Acessar

1. Abra: http://localhost:3000
2. Login: `admin@example.com` / `admin123`

## ✅ Pronto!

Se tudo funcionou, você verá:
- Backend rodando em: http://localhost:3001
- Frontend rodando em: http://localhost:3000
- Banco de dados criado e populado

## 🐛 Problemas?

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
brew services list | grep postgresql

# Se não estiver, iniciar:
brew services start postgresql@15
# ou
pg_ctl -D /usr/local/var/postgres start
```

### Erro de permissão
```bash
# Dar permissões ao seu usuário
psql postgres -c "ALTER USER $(whoami) WITH SUPERUSER;"
```

### Ver banco de dados
```bash
psql affiliate_db -c "\dt"  # Listar tabelas
```
