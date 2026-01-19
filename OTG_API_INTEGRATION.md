# Integração com API OTG Partners

## 📡 Configuração

A integração com a API OTG Partners está configurada no arquivo `backend/src/services/otgAdapter.ts`.

### Variáveis de Ambiente Necessárias

No arquivo `backend/.env`:

```env
OTG_API_KEY="pk_sua_chave_aqui"
OTG_API_BASE_URL="https://api-partners.grupootg.com/api/v1"
```

## 🔌 Endpoints da API OTG

### 1. Listar Afiliados
- **Endpoint**: `GET /external/affiliates`
- **Autenticação**: `X-API-Key` header
- **Resposta**: Array de afiliados com `id`, `name`, `siteIds`

### 2. Listar Campanhas
- **Endpoint**: `GET /external/campaigns`
- **Autenticação**: `X-API-Key` header
- **Resposta**: Array de campanhas com `id`, `name`

### 3. Obter Resultados
- **Endpoint**: `GET /external/results`
- **Autenticação**: `X-API-Key` header
- **Parâmetros**:
  - `startDate` (obrigatório): Data inicial no formato `YYYY-MM-DD`
  - `endDate` (obrigatório): Data final no formato `YYYY-MM-DD`
  - `groupBy` (opcional): `affiliate`, `campaign`, ou `date`
  - `affiliateIds` (opcional): Array de IDs de afiliados
  - `campaignIds` (opcional): Array de IDs de campanhas
  - `page` (opcional): Número da página (padrão: 1)
  - `limit` (opcional): Itens por página (padrão: 50)

**Resposta**:
```json
{
  "data": [
    {
      "affiliateId": "clx123...",
      "affiliateName": "Afiliado Exemplo",
      "campaignName": "Campanha Black Friday",
      "date": "2024-01-15",
      "lucro_tipster": 150.5,
      "cpa": 5,
      "rvs": 50,
      "registrations": 15,
      "first_deposits": 8,
      "qualified_cpa": 6
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 10,
    "totalRows": 500,
    "pageSize": 50
  }
}
```

## 🔄 Sincronização Automática

O sistema possui dois cron jobs configurados:

1. **Sincronização de Afiliados**: A cada hora
2. **Sincronização de Resultados**: A cada 5 minutos

Os cron jobs estão em `backend/src/services/cron.ts`.

## 🧪 Testar Conexão

### Via API REST (Admin Only)

```bash
# Testar conexão
curl -X GET http://localhost:3001/api/otg/test \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"

# Sincronizar afiliados manualmente
curl -X POST http://localhost:3001/api/otg/sync/affiliates \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"

# Sincronizar resultados manualmente
curl -X POST http://localhost:3001/api/otg/sync/results \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

### Resposta de Teste

```json
{
  "success": true,
  "message": "Conexão com API OTG estabelecida com sucesso",
  "affiliatesCount": 10,
  "campaignsCount": 5
}
```

## 📊 Processamento de Dados

### FTDs (First Time Deposits)
- Campo usado: `first_deposits`
- Cada registro cria um FTD no banco
- Se `qualified_cpa > 0`, cria comissão CPA

### Revenue Share
- Campo usado: `rvs` e `lucro_tipster`
- Calcula comissão: `(lucro_tipster * revSharePercentage) / 100`
- Cria registro em `revshare_reports`

### CPAs Qualificados
- Campo usado: `qualified_cpa`
- Valor da comissão vem de `system_configs` (chave: `CPA_VALUE`)

## ⚠️ Tratamento de Erros

O adapter trata os seguintes erros:

- **401 Unauthorized**: Chave de API inválida ou expirada
- **400 Bad Request**: Parâmetros inválidos (datas, formato, etc.)
- **Timeout**: Requisição demorou mais de 30 segundos
- **Network Error**: Problemas de conexão

Todos os erros são logados no console com detalhes.

## 🔍 Logs

O adapter possui logging detalhado:

- ✅ Requisições bem-sucedidas
- ❌ Erros de requisição
- 📊 Progresso de sincronização
- 📄 Páginas processadas

Exemplo de log:
```
📡 OTG API Request: GET /external/results
✅ OTG API Response: 200 /external/results
🔄 Sincronizando resultados de 2024-01-01 até 2024-01-31
📄 Processando página 1...
📊 Progresso: 1/10 páginas processadas
✅ Resultados sincronizados com sucesso. Total processado: 500 registros
```

## 🛠️ Endpoints de Administração

### `GET /api/otg/test`
Testa a conexão com a API OTG e retorna estatísticas.

### `POST /api/otg/sync/affiliates`
Força sincronização manual de afiliados.

### `POST /api/otg/sync/results`
Força sincronização manual de resultados.

**Nota**: Todos os endpoints de administração requerem autenticação e permissão de ADMIN.

## 📝 Notas Importantes

1. **Formato de Data**: Sempre use `YYYY-MM-DD` (ex: `2024-01-15`)
2. **Arrays de IDs**: Enviados como query params múltiplos: `affiliateIds[]=id1&affiliateIds[]=id2`
3. **Paginação**: A API retorna até 50 itens por página por padrão
4. **Deduplicação**: O sistema evita criar registros duplicados verificando por data e afiliado
5. **Valores Configuráveis**: CPA e Revenue Share vêm de `system_configs`, nunca hardcoded

## 🔐 Segurança

- A chave da API é armazenada em variável de ambiente
- Nunca commite a chave no código
- Use `.env` para configuração local
- Em produção, use variáveis de ambiente seguras
