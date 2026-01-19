# 🚀 Guia Rápido de Teste

## ✅ Servidores Iniciados

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

## 🔐 Login Inicial

**Credenciais Admin:**
- Email: `admin@example.com`
- Senha: `admin123`

## 📋 Passos para Testar

### 1. Acessar o Dashboard

1. Abra: http://localhost:3000
2. Faça login com as credenciais acima
3. Você verá o dashboard com:
   - Card de Limites (valores padrão: R$ 300 CPA, 25% RevShare)
   - Link de Indicação
   - Filtros
   - Cards de Métricas
   - Tabela de Afiliados

### 2. Criar um Deal (Admin)

```bash
# Obter token de admin primeiro
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Copiar o token da resposta e usar abaixo
TOKEN="seu_token_aqui"

# Criar deal
curl -X POST http://localhost:3001/api/deals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Deal Premium",
    "cpaValue": 500,
    "revSharePercentage": 35,
    "description": "Deal especial para testar"
  }'
```

### 3. Listar Afiliados

```bash
curl http://localhost:3001/api/affiliates \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Associar Deal a um Afiliado

```bash
# Substituir deal_id e affiliate_id pelos IDs reais
curl -X POST http://localhost:3001/api/deals/DEAL_ID/affiliate/AFFILIATE_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Verificar Dashboard do Afiliado

1. Faça logout
2. Crie um usuário afiliado ou use um existente
3. Faça login como afiliado
4. O dashboard deve mostrar os valores do deal

### 6. Testar Sincronização OTG (Opcional)

```bash
# Testar conexão
curl http://localhost:3001/api/otg/test \
  -H "Authorization: Bearer $TOKEN"

# Sincronizar afiliados manualmente
curl -X POST http://localhost:3001/api/otg/sync/affiliates \
  -H "Authorization: Bearer $TOKEN"

# Sincronizar resultados manualmente
curl -X POST http://localhost:3001/api/otg/sync/results \
  -H "Authorization: Bearer $TOKEN"
```

## 🧪 Testes Rápidos

### Verificar Health Check

```bash
curl http://localhost:3001/health
```

### Verificar Métricas

```bash
curl http://localhost:3001/api/dashboard/metrics \
  -H "Authorization: Bearer $TOKEN"
```

### Verificar Configurações

```bash
curl http://localhost:3001/api/config \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 O que Verificar

✅ **Dashboard carrega sem erros**
✅ **Card de Limites mostra valores corretos**
✅ **Deal aparece quando associado**
✅ **Tabela de Afiliados funciona**
✅ **Filtros funcionam**
✅ **API retorna dados corretos**

## 🐛 Problemas Comuns

### Backend não inicia
- Verifique se PostgreSQL está rodando: `psql -l`
- Verifique variáveis de ambiente no `.env`

### Frontend não conecta
- Verifique se backend está rodando na porta 3001
- Verifique `NEXT_PUBLIC_API_URL` no `.env.local`

### Erro de autenticação
- Verifique se o token está sendo enviado corretamente
- Faça login novamente para obter novo token

## 📝 Próximos Passos

1. ✅ Testar criação de deals
2. ✅ Testar associação de deals
3. ✅ Verificar valores no dashboard
4. ✅ Testar sincronização OTG (se tiver API key)
5. ✅ Testar filtros e métricas
