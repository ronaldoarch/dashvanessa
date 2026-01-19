# Fix Rápido - Erro Bad Gateway (502)

## Checklist de Verificação

### 1. ✅ Verificar se o Backend está Rodando

No Coolify:
1. Vá até o serviço do **backend**
2. Verifique o status: deve estar **"Running"** (verde)
3. Se estiver parado ou com erro, clique em **"Restart"**

### 2. ✅ Verificar Logs do Backend

No Coolify, clique em **"Logs"** ou **"Show Debug Logs"** do backend.

**Procure por:**
- ✅ `🚀 Server running on http://0.0.0.0:3001` - Backend iniciou corretamente
- ❌ `Error: Can't reach database server` - Problema com DATABASE_URL
- ❌ `Error: Migration failed` - Precisa executar migrations
- ❌ `Error: listen EADDRINUSE` - Porta já em uso

### 3. ✅ Verificar Variáveis de Ambiente do Backend

No Coolify, vá em **Settings > Environment Variables** do backend:

**Obrigatórias:**
```
DATABASE_URL=<url_do_postgresql>
JWT_SECRET=<sua_chave_secreta>
PORT=3001
CORS_ORIGIN=https://<url-do-frontend>
```

**Importante:**
- `NODE_ENV=production` deve estar marcado como **"Runtime only"** (NÃO marque "Available at Buildtime")

### 4. ✅ Executar Migrations (se necessário)

Se os logs mostrarem erro de banco de dados:

1. No Coolify, vá até o backend
2. Clique em **"Terminal"** ou **"Shell"**
3. Execute:
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npm run seed
```

### 5. ✅ Testar Health Check

Após o backend iniciar, teste:

```bash
curl https://<url-do-backend>/health
```

Ou acesse no navegador: `https://<url-do-backend>/health`

**Deve retornar:**
```json
{"status":"ok","timestamp":"..."}
```

### 6. ✅ Verificar Porta no Coolify

No Coolify, vá em **Settings** do backend:
- **Port**: Deve estar configurado como `3001`
- **Expose Port**: Deve estar marcado

### 7. ✅ Verificar Frontend

Se o backend estiver funcionando mas o frontend ainda mostra erro:

1. Verifique a variável `NEXT_PUBLIC_API_URL` no frontend:
   ```
   NEXT_PUBLIC_API_URL=https://<url-do-backend>/api
   ```
2. Faça um novo deploy do frontend após corrigir

## Solução Rápida

Se nada funcionar, tente:

1. **Reiniciar o backend** no Coolify
2. **Verificar logs** para ver o erro exato
3. **Executar migrations** se houver erro de banco
4. **Verificar DATABASE_URL** está correto

## Erros Comuns e Soluções

### "Can't reach database server"
- Verifique se `DATABASE_URL` está correto
- Use a **Internal URL** do PostgreSQL (não a externa)
- Verifique se o banco está rodando

### "Migration failed"
- Execute: `npx prisma migrate deploy`
- Verifique se o banco tem permissões

### "Port already in use"
- Verifique se a porta 3001 está configurada corretamente
- Reinicie o serviço

### Backend não inicia
- Verifique todos os logs
- Confirme que todas as variáveis de ambiente estão configuradas
- Verifique se o build foi bem-sucedido
