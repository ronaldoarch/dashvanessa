# Sistema de Deals

## 📋 Visão Geral

O sistema de Deals permite que o administrador crie acordos personalizados com valores de CPA e Revenue Share específicos para cada afiliado. Quando um afiliado tem um deal associado, os valores do deal são usados ao invés dos valores padrão do sistema.

## 🎯 Como Funciona

1. **Admin cria um Deal** com valores de CPA e Revenue Share específicos
2. **Admin associa o Deal a um Afiliado**
3. **O Dashboard do Afiliado** mostra os valores do deal
4. **Os cálculos de comissão** usam os valores do deal

## 🔧 Endpoints da API

### Listar Deals

```bash
GET /api/deals
```

**Resposta:**
- Admin: Lista todos os deals
- Afiliado: Lista apenas seu deal (se tiver)

### Criar Deal (Admin Only)

```bash
POST /api/deals
Content-Type: application/json
Authorization: Bearer TOKEN_ADMIN

{
  "name": "Deal Premium",
  "cpaValue": 350,
  "revSharePercentage": 30,
  "description": "Deal especial para afiliados premium",
  "active": true
}
```

### Atualizar Deal (Admin Only)

```bash
PUT /api/deals/:id
Content-Type: application/json
Authorization: Bearer TOKEN_ADMIN

{
  "cpaValue": 400,
  "revSharePercentage": 35,
  "active": true
}
```

### Associar Deal a Afiliado (Admin Only)

```bash
POST /api/deals/:dealId/affiliate/:affiliateId
Authorization: Bearer TOKEN_ADMIN
```

### Remover Associação (Admin Only)

```bash
DELETE /api/deals/:dealId/affiliate/:affiliateId
Authorization: Bearer TOKEN_ADMIN
```

### Deletar Deal (Admin Only)

```bash
DELETE /api/deals/:id
Authorization: Bearer TOKEN_ADMIN
```

**Nota:** Não é possível deletar um deal que tenha afiliados associados.

## 📊 Estrutura do Deal

```typescript
{
  id: string
  name: string                    // Nome do deal
  cpaValue: number                // Valor do CPA em R$
  revSharePercentage: number      // Porcentagem de Revenue Share
  description?: string            // Descrição opcional
  active: boolean                 // Se o deal está ativo
  createdAt: DateTime
  updatedAt: DateTime
  affiliates: Affiliate[]         // Afiliados associados
}
```

## 💡 Exemplos de Uso

### Criar Deal e Associar a Afiliado

```bash
# 1. Criar deal
curl -X POST http://localhost:3001/api/deals \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Deal Especial",
    "cpaValue": 500,
    "revSharePercentage": 35,
    "description": "Deal com valores aumentados"
  }'

# Resposta: { "id": "deal_123", ... }

# 2. Associar a afiliado
curl -X POST http://localhost:3001/api/deals/deal_123/affiliate/affiliate_456 \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

### Ver Deal do Afiliado

```bash
# Como afiliado
curl http://localhost:3001/api/deals \
  -H "Authorization: Bearer TOKEN_AFFILIATE"

# Resposta: [{ "id": "deal_123", "name": "Deal Especial", "cpaValue": 500, ... }]
```

## 🎨 Visualização no Dashboard

Quando um afiliado tem um deal associado:

1. **Card de Limites** mostra:
   - Valor do CPA do deal (ex: R$ 500,00)
   - Porcentagem de RevShare do deal (ex: 35%)
   - Badge com o nome do deal

2. **Tabela de Afiliados** (admin) mostra:
   - Valores calculados usando o deal de cada afiliado
   - Campo `dealName` na resposta da API

## ⚙️ Comportamento

### Com Deal Associado
- ✅ Usa valores do deal para cálculos
- ✅ Dashboard mostra valores do deal
- ✅ Sincronização usa valores do deal

### Sem Deal Associado
- ✅ Usa valores padrão do sistema (configurações)
- ✅ Dashboard mostra valores padrão
- ✅ Sincronização usa valores padrão

### Deal Inativo
- ✅ Tratado como se não houvesse deal
- ✅ Usa valores padrão do sistema

## 🔄 Fluxo de Cálculo

1. Sistema verifica se afiliado tem deal ativo
2. Se tiver deal:
   - Usa `deal.cpaValue` para CPA
   - Usa `deal.revSharePercentage` para Revenue Share
3. Se não tiver deal:
   - Usa valores de `system_configs` (CPA_VALUE, REVENUE_SHARE_PERCENTAGE)

## 📝 Notas Importantes

1. **Valores sempre do backend**: Nunca hardcoded no frontend
2. **Deal tem prioridade**: Se existir deal ativo, ele é usado
3. **Valores padrão**: Sempre há fallback para valores do sistema
4. **Auditável**: Todas as mudanças são registradas com timestamps
5. **Flexível**: Pode ter múltiplos deals, cada um com valores diferentes

## 🚀 Próximos Passos

Para usar o sistema:

1. Execute a migração do banco (já feito)
2. Crie deals via API ou interface admin
3. Associe deals aos afiliados
4. Os valores aparecerão automaticamente no dashboard
