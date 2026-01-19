# Estrutura do Projeto

## 📁 Organização de Arquivos

```
dashvanessa/
├── backend/                    # Backend Node.js + Express
│   ├── prisma/
│   │   └── schema.prisma      # Schema do banco de dados
│   ├── src/
│   │   ├── index.ts           # Ponto de entrada do servidor
│   │   ├── middleware/        # Middlewares (auth, error handling)
│   │   ├── routes/            # Rotas da API
│   │   │   ├── auth.ts        # Autenticação
│   │   │   ├── affiliates.ts  # Gestão de afiliados
│   │   │   ├── dashboard.ts   # Métricas e dashboard
│   │   │   └── config.ts      # Configurações do sistema
│   │   ├── services/          # Serviços de negócio
│   │   │   ├── config.ts      # Gerenciamento de configurações
│   │   │   ├── otgAdapter.ts  # Adapter para API OTG Partners
│   │   │   └── cron.ts        # Configuração de cron jobs
│   │   └── scripts/
│   │       └── seed.ts        # Script de seed do banco
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                   # Frontend Next.js
│   ├── app/
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Página inicial (redirect)
│   │   ├── login/
│   │   │   └── page.tsx       # Página de login
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Dashboard principal
│   │   └── globals.css        # Estilos globais
│   ├── components/
│   │   ├── DashboardCards.tsx # Cards de métricas
│   │   ├── AffiliatesTable.tsx # Tabela de afiliados
│   │   └── Filters.tsx        # Componente de filtros
│   ├── hooks/
│   │   └── useAuth.tsx        # Hook de autenticação
│   ├── lib/
│   │   ├── api.ts             # Cliente Axios configurado
│   │   └── utils.ts           # Funções utilitárias
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── docker-compose.yml          # Configuração Docker para PostgreSQL
├── README.md                   # Documentação principal
├── SETUP.md                    # Guia de instalação
├── API_EXAMPLES.md            # Exemplos de uso da API
└── .gitignore
```

## 🗄️ Banco de Dados

### Tabelas Principais

1. **users** - Usuários do sistema (admin/afiliado)
2. **affiliates** - Afiliados cadastrados
3. **players** - Jogadores vinculados
4. **ftds** - First Time Deposits
5. **transactions** - Transações de comissões
6. **commissions** - Comissões calculadas
7. **revshare_reports** - Relatórios de Revenue Share
8. **system_configs** - Configurações do sistema

### Relacionamentos

- `User` 1:1 `Affiliate`
- `Affiliate` 1:N `Player`
- `Affiliate` 1:N `FTD`
- `Affiliate` 1:N `Transaction`
- `Affiliate` 1:N `Commission`
- `Affiliate` 1:N `RevShareReport`
- `Player` 1:N `FTD`
- `Player` 1:N `Transaction`

## 🔄 Fluxo de Dados

### Sincronização Externa

1. **Cron Job** executa a cada 5 minutos
2. **OTG Adapter** busca dados da API externa
3. Dados são **normalizados** e **validados**
4. **Afiliados** são criados/atualizados automaticamente
5. **FTDs** e **Revenue Share** são processados
6. **Comissões** são calculadas automaticamente
7. **Transações** são registradas

### Autenticação

1. Usuário faz **login** com email/senha
2. Backend **valida** credenciais
3. **JWT token** é gerado e retornado
4. Token é armazenado no **localStorage**
5. Token é enviado em todas as requisições via **header Authorization**

### Dashboard

1. Frontend **busca métricas** via API
2. Dados são **filtrados** por data/afiliado
3. **Cards** exibem resumo geral
4. **Tabela** mostra detalhes por afiliado
5. Valores são **formatados** em BRL

## 🔐 Segurança

- **JWT** para autenticação
- **bcrypt** para hash de senhas
- **Middleware** de autenticação em todas as rotas protegidas
- **Controle de permissões** (admin vs afiliado)
- **Validação** de dados de entrada
- **Sanitização** de queries SQL (via Prisma)

## 📊 Métricas Calculadas

### Por Afiliado
- **FTDs**: Total de First Time Deposits
- **CPAs**: Total de CPAs qualificados
- **Valor CPA**: CPAs × Valor CPA configurado
- **Valor Rev Share**: Soma das comissões de Revenue Share
- **Total**: Valor CPA + Valor Rev Share

### Geral
- Soma de todas as métricas acima
- Valores configuráveis (CPA e Revenue Share %)

## 🎯 Valores Configuráveis

Todos os valores vêm do backend, nunca hardcoded:

- **CPA Value**: Armazenado em `system_configs` (chave: `CPA_VALUE`)
- **Revenue Share %**: Armazenado em `system_configs` (chave: `REVENUE_SHARE_PERCENTAGE`)

Podem ser atualizados via:
- API REST (`PUT /api/config`)
- Prisma Studio
- SQL direto

## 🚀 Deploy

### Backend
- Porta padrão: `3001`
- Variáveis de ambiente obrigatórias: `DATABASE_URL`, `JWT_SECRET`
- Migrações devem ser executadas antes do start

### Frontend
- Porta padrão: `3000`
- Variável obrigatória: `NEXT_PUBLIC_API_URL`
- Build: `npm run build`
- Start: `npm start`

## 📝 Próximas Melhorias Sugeridas

1. **Testes**: Unitários e de integração
2. **Logs**: Sistema de logging estruturado
3. **Cache**: Redis para otimização
4. **Rate Limiting**: Proteção contra abuso
5. **Webhooks**: Notificações em tempo real
6. **Exportação**: CSV/Excel dos relatórios
7. **Gráficos**: Visualizações com Recharts
8. **Notificações**: Email/SMS para afiliados
9. **Multi-tenancy**: Suporte a múltiplas empresas
10. **Auditoria**: Log completo de todas as ações
