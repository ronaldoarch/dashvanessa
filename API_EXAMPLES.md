# Exemplos de Uso da API

## 🔐 Autenticação

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Resposta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx123...",
    "email": "admin@example.com",
    "name": "Administrador",
    "role": "ADMIN"
  }
}
```

### Obter Usuário Atual

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 📊 Dashboard

### Obter Métricas Gerais

```bash
curl "http://localhost:3001/api/dashboard/metrics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta:
```json
{
  "totalFTDs": 150,
  "totalCPAs": 120,
  "totalCPAValue": 36000,
  "totalRevShare": 12500.50,
  "cpaValue": 300,
  "revSharePercentage": 25
}
```

### Obter Métricas por Afiliado

```bash
curl "http://localhost:3001/api/dashboard/affiliates?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta:
```json
[
  {
    "id": "clx123...",
    "name": "Afiliado Exemplo",
    "externalId": "clx1234567890abcdef",
    "ftds": 50,
    "cpas": 45,
    "cpaValue": 13500,
    "revShareValue": 4500.25,
    "cpaValuePerUnit": 300,
    "revSharePercentage": 25
  }
]
```

### Obter Transações

```bash
curl "http://localhost:3001/api/dashboard/transactions?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=50" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta:
```json
{
  "data": [
    {
      "id": "clx123...",
      "affiliateId": "clx456...",
      "amount": "300.00",
      "type": "CPA",
      "status": "APPROVED",
      "date": "2024-01-15T10:00:00.000Z",
      "description": "CPA - Campanha Black Friday"
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRows": 250,
    "pageSize": 50
  }
}
```

## 👥 Afiliados

### Listar Afiliados

```bash
curl http://localhost:3001/api/affiliates \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Obter Afiliado Específico

```bash
curl http://localhost:3001/api/affiliates/clx123... \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Criar Afiliado (Admin Only)

```bash
curl -X POST http://localhost:3001/api/affiliates \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Novo Afiliado",
    "externalId": "clx999...",
    "siteIds": [12345, 67890],
    "userId": "clx888..."
  }'
```

## ⚙️ Configurações

### Obter Configurações

```bash
curl http://localhost:3001/api/config \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta:
```json
{
  "cpaValue": 300,
  "revSharePercentage": 25
}
```

### Atualizar Configurações (Admin Only)

```bash
curl -X PUT http://localhost:3001/api/config \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "cpaValue": 350,
    "revSharePercentage": 30
  }'
```

## 🔄 Sincronização Manual (Futuro)

Para sincronizar manualmente os dados da API externa, você pode criar endpoints administrativos ou executar os métodos diretamente:

```typescript
import { otgAdapter } from './services/otgAdapter';

// Sincronizar afiliados
await otgAdapter.syncAffiliates();

// Sincronizar resultados
await otgAdapter.syncResults();
```

## 📝 Notas

- Todos os endpoints (exceto `/api/auth/login`) requerem autenticação via header `Authorization: Bearer TOKEN`
- Afiliados só podem ver seus próprios dados
- Admins podem ver todos os dados
- Os valores de CPA e Revenue Share são configuráveis e vêm sempre do backend
- As datas devem estar no formato `YYYY-MM-DD`
