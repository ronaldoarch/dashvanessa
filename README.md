# Painel de Afiliados - DashVanessa

Sistema completo de gestão de afiliados com integração à API OTG Partners.

## 🏗️ Arquitetura

### Backend
- **Node.js + Express + TypeScript**
- **Prisma ORM** com PostgreSQL
- **JWT** para autenticação
- **Cron Jobs** para sincronização automática
- **API REST** completa

### Frontend
- **Next.js 14** com React
- **TypeScript**
- **Tailwind CSS** para estilização
- **Axios** para requisições HTTP

## 📋 Funcionalidades

- ✅ Autenticação JWT (Admin e Afiliado)
- ✅ Dashboard com métricas em tempo real
- ✅ Gestão de afiliados
- ✅ Cálculo automático de CPA (R$ 300 configurável)
- ✅ Cálculo automático de Revenue Share (25% configurável)
- ✅ Integração com API externa OTG Partners
- ✅ Sincronização automática via cron jobs
- ✅ Filtros por data, afiliado e status
- ✅ Tabelas detalhadas por afiliado

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite o .env com suas configurações
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edite o .env.local com a URL da API
npm run dev
```

## 🔧 Configuração

### Variáveis de Ambiente - Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/affiliate_db"
JWT_SECRET="sua-chave-secreta-aqui"
JWT_EXPIRES_IN="7d"
OTG_API_KEY="pk_sua_chave_otg_aqui"
OTG_API_BASE_URL="https://api-partners.grupootg.com/api/v1"
PORT=3001
DEFAULT_CPA_VALUE=300
DEFAULT_REVENUE_SHARE_PERCENTAGE=25
```

### Variáveis de Ambiente - Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 📊 Banco de Dados

O sistema utiliza as seguintes tabelas:

- `users` - Usuários do sistema (admin/afiliado)
- `affiliates` - Afiliados cadastrados
- `players` - Jogadores vinculados aos afiliados
- `ftds` - First Time Deposits
- `transactions` - Transações de comissões
- `commissions` - Comissões calculadas
- `revshare_reports` - Relatórios de Revenue Share
- `system_configs` - Configurações do sistema (CPA, Revenue Share)

## 🔐 Autenticação

### Criar usuário admin (via Prisma Studio ou SQL)

```sql
INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  'admin-id',
  'admin@example.com',
  '$2a$10$hashed_password_here',
  'Admin',
  'ADMIN',
  NOW(),
  NOW()
);
```

Ou use o Prisma Studio:
```bash
cd backend
npx prisma studio
```

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registrar usuário (admin only)
- `GET /api/auth/me` - Obter usuário atual

### Dashboard
- `GET /api/dashboard/metrics` - Métricas gerais
- `GET /api/dashboard/affiliates` - Métricas por afiliado
- `GET /api/dashboard/transactions` - Histórico de transações

### Afiliados
- `GET /api/affiliates` - Listar afiliados
- `GET /api/affiliates/:id` - Obter afiliado específico
- `POST /api/affiliates` - Criar afiliado (admin only)

### Configurações
- `GET /api/config` - Obter configurações (CPA, Revenue Share)
- `PUT /api/config` - Atualizar configurações (admin only)

## ⏰ Cron Jobs

O sistema possui dois cron jobs configurados:

1. **Sincronização de Afiliados**: Executa a cada hora
2. **Sincronização de Resultados**: Executa a cada 5 minutos

## 🎨 Valores Configuráveis

Os valores de CPA e Revenue Share são configuráveis via API e banco de dados:

- **CPA Fixo**: R$ 300 (padrão, configurável)
- **Revenue Share**: 25% (padrão, configurável)

Esses valores são armazenados na tabela `system_configs` e podem ser atualizados via endpoint `/api/config` (apenas admin).

## 📝 Notas Importantes

1. **Valores nunca hardcoded**: Todos os valores vêm do backend/configurações
2. **Auditável**: Todas as transações são registradas com timestamps
3. **Versionado**: Histórico completo de todas as operações
4. **Seguro**: Autenticação JWT e controle de permissões

## 🐛 Troubleshooting

### Erro de conexão com banco de dados
Verifique se o PostgreSQL está rodando e se as credenciais no `.env` estão corretas.

### Erro de autenticação na API externa
Verifique se a `OTG_API_KEY` está correta no arquivo `.env`.

### Erro de migração do Prisma
Execute `npx prisma migrate reset` para resetar o banco (cuidado: apaga todos os dados).

## 📄 Licença

ISC
