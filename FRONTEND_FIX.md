# Fix - Frontend Bad Gateway

## Problema

O frontend está mostrando "Bad Gateway", o que significa que:
1. O frontend não está rodando, OU
2. O frontend não está configurado corretamente

## Soluções

### 1. Verificar se o Frontend está Rodando

No Coolify:
1. Vá até o serviço do **frontend**
2. Verifique o status: deve estar **"Running"** (verde)
3. Se estiver parado, clique em **"Restart"**

### 2. Verificar Variável de Ambiente

No Coolify, vá em **Settings > Environment Variables** do frontend:

**Deve ter:**
```
NEXT_PUBLIC_API_URL=https://x0k0gkcgws8w0cw0oocsg8c0.agenciamidas.com/api
```

**Importante:**
- ✅ Use `https://` (não `http://`)
- ✅ Use `/api` no final
- ❌ NÃO coloque barra extra no final
- ✅ Deve estar marcado como **"Available at Buildtime"** (importante para Next.js)

### 3. Verificar Logs do Frontend

No Coolify, clique em **"Logs"** do frontend e procure por:
- ✅ `Ready in X.Xs` - Frontend iniciou corretamente
- ❌ Erros de build
- ❌ Erros de conexão

### 4. Verificar Porta

No Coolify, vá em **Settings** do frontend:
- **Port**: Deve estar configurado como `3000`
- **Expose Port**: Deve estar marcado

### 5. Fazer Novo Deploy do Frontend

Se a variável `NEXT_PUBLIC_API_URL` foi alterada:
1. Vá até o frontend no Coolify
2. Clique em **"Redeploy"** ou **"Deploy"**
3. Aguarde o build completar

### 6. Testar Endpoints do Backend

Para confirmar que o backend está funcionando, teste:

```
https://x0k0gkcgws8w0cw0oocsg8c0.agenciamidas.com/health
https://x0k0gkcgws8w0cw0oocsg8c0.agenciamidas.com/api/config
```

Ambos devem retornar JSON válido.

## Checklist

- [ ] Frontend está rodando (status "Running")
- [ ] `NEXT_PUBLIC_API_URL` está configurado corretamente
- [ ] `NEXT_PUBLIC_API_URL` está marcado como "Available at Buildtime"
- [ ] Porta 3000 está configurada
- [ ] Logs do frontend não mostram erros
- [ ] Backend está respondendo (teste `/health`)

## Erro "Cannot GET /api"

Este erro é **normal** quando você acessa diretamente `/api` no backend. 

As rotas válidas são:
- `/api/auth/login`
- `/api/dashboard/metrics`
- `/api/config`
- `/health`

O frontend deve usar `NEXT_PUBLIC_API_URL` que já inclui `/api` no final.
