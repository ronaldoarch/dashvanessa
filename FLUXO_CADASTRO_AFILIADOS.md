# Fluxo de Cadastro de Afiliados

Este documento descreve o fluxo completo de cadastro de afiliados integrado com a Superbet.

## Visão Geral

O sistema permite que o admin envie links de cadastro para afiliados, que se cadastram através da API da Superbet. Quando a Superbet aprova, o admin recebe o link de afiliado e pode criar um deal personalizado para o afiliado.

## Fluxo Passo a Passo

### 1. Admin Cria Convite

**Endpoint:** `POST /api/invites`

O admin acessa `/admin/invites` e cria um novo convite informando:
- Email do afiliado
- Nome do afiliado
- Dias até expiração (padrão: 7 dias)

O sistema gera:
- Código único do convite
- Link de cadastro: `{FRONTEND_URL}/register?invite={CODE}`

### 2. Admin Envia Link para Afiliado

O admin copia o link de cadastro e envia para o afiliado via email, WhatsApp, etc.

### 3. Afiliado se Cadastra

**Endpoint:** `POST /api/invites/:code/register`

O afiliado acessa o link e preenche:
- Senha
- Confirmar senha
- Telefone (opcional)
- Empresa (opcional)

O sistema:
1. Valida o convite (não expirado, status PENDING)
2. Envia dados para API Superbet (`POST /affiliates/register`)
3. Recebe `requestId` da Superbet
4. Atualiza convite com `superbetRequestId`

**Possíveis resultados:**
- **Aprovado imediatamente**: Cria usuário e afiliado automaticamente
- **Pendente**: Aguarda aprovação da Superbet

### 4. Superbet Aprova (Webhook)

**Endpoint:** `POST /api/invites/webhook/superbet`

Quando a Superbet aprova, ela envia um webhook com:
- `requestId`: ID da requisição
- `affiliateId`: ID do afiliado na Superbet
- `affiliateLink`: Link de afiliado da Superbet
- `status`: "approved" ou "rejected"

O sistema:
1. Valida token do webhook (`X-Webhook-Token`)
2. Busca convite pelo `requestId`
3. Cria usuário e afiliado (se ainda não existir)
4. Atualiza afiliado com `superbetAffiliateLink` e `superbetAffiliateId`
5. Marca convite como `APPROVED`

### 5. Admin Recebe Notificação

O admin acessa `/admin/invites` e vê:
- Status: `APPROVED`
- Link Superbet disponível
- Botão "Criar Deal"

### 6. Admin Cria Deal

**Endpoint:** `POST /api/deals` + `POST /api/deals/:dealId/affiliate/:affiliateId`

O admin clica em "Criar Deal" e:
1. Acessa `/admin/affiliates/:id/deal`
2. Cria um novo deal ou seleciona existente
3. Define:
   - Nome do deal
   - CPA (valor por FTD)
   - RevShare (percentual)
   - Descrição (opcional)
4. Associa ao afiliado

### 7. Admin Passa Acesso para Afiliado

O admin informa ao afiliado:
- Email de login
- Senha (ou link de reset)
- Link do dashboard: `{FRONTEND_URL}/dashboard`

### 8. Afiliado Acessa e Vê seu Deal

O afiliado faz login e pode:
- Ver seu deal em `/affiliate/my-deal`
- Ver métricas no dashboard
- Ver link de afiliado da Superbet
- Ver link de indicação próprio

## Estrutura de Dados

### AffiliateInvite

```typescript
{
  id: string
  code: string // Código único do convite
  email: string
  name: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  expiresAt: Date
  affiliateId?: string // Criado quando aprovado
  superbetRequestId?: string // ID da requisição na Superbet
}
```

### Affiliate (atualizado)

```typescript
{
  id: string
  name: string
  superbetAffiliateLink?: string // Link recebido da Superbet
  superbetAffiliateId?: string // ID na Superbet
  dealId?: string // Deal associado
  // ... outros campos
}
```

## Variáveis de Ambiente Necessárias

### Backend

```env
# Superbet API
SUPERBET_API_KEY=pk_sua_chave_aqui
SUPERBET_API_URL=https://api.superbet.com/v1
SUPERBET_WEBHOOK_TOKEN=token_secreto_webhook

# Frontend URL (para gerar links)
FRONTEND_URL=https://seu-dominio.com
```

### Frontend

```env
NEXT_PUBLIC_API_URL=https://api.seu-dominio.com
```

## Endpoints da API

### Convites

- `GET /api/invites` - Listar convites (admin)
- `POST /api/invites` - Criar convite (admin)
- `GET /api/invites/:code` - Obter convite por código (público)
- `POST /api/invites/:code/register` - Registrar afiliado (público)
- `POST /api/invites/webhook/superbet` - Webhook da Superbet (público, protegido por token)
- `POST /api/invites/:id/check-status` - Verificar status manualmente (admin)

### Deals

- `GET /api/deals` - Listar deals (admin)
- `POST /api/deals` - Criar deal (admin)
- `POST /api/deals/:dealId/affiliate/:affiliateId` - Associar deal (admin)
- `DELETE /api/deals/affiliate/:affiliateId` - Remover deal (admin)

## Páginas do Frontend

### Admin

- `/admin/invites` - Gerenciar convites
- `/admin/affiliates/:id/deal` - Criar/associar deal ao afiliado

### Afiliado

- `/register?invite={CODE}` - Página de cadastro
- `/affiliate/my-deal` - Ver deal e informações
- `/dashboard` - Dashboard com métricas

## Integração com Superbet

### Registrar Afiliado

```typescript
POST /affiliates/register
{
  "email": "afiliado@example.com",
  "name": "Nome do Afiliado",
  "phone": "+5511999999999",
  "company": "Nome da Empresa"
}

Response:
{
  "requestId": "req_123456",
  "status": "pending" | "approved" | "rejected",
  "affiliateLink": "https://...", // Se aprovado
  "affiliateId": "aff_123456" // Se aprovado
}
```

### Webhook de Aprovação

```typescript
POST /api/invites/webhook/superbet
Headers:
  X-Webhook-Token: {SUPERBET_WEBHOOK_TOKEN}

Body:
{
  "requestId": "req_123456",
  "affiliateId": "aff_123456",
  "affiliateLink": "https://superbet.com/affiliate/...",
  "status": "approved"
}
```

## Troubleshooting

### Convite não encontrado
- Verificar se o código está correto
- Verificar se não expirou
- Verificar se já foi usado

### Webhook não funciona
- Verificar `SUPERBET_WEBHOOK_TOKEN` no backend
- Verificar se a URL do webhook está correta na Superbet
- Verificar logs do backend

### Afiliado não recebe link Superbet
- Verificar se foi aprovado pela Superbet
- Usar botão "Verificar Status" em `/admin/invites`
- Verificar logs do webhook

### Deal não aparece para afiliado
- Verificar se deal foi associado corretamente
- Verificar se afiliado está logado
- Verificar se `affiliateId` está correto no usuário
