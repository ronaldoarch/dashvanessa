# Verificação Final - Deploy Completo

## ✅ Backend Funcionando

O health check confirmou que o backend está rodando:
- URL: `https://x0k0gkcgws8w0cw0oocsg8c0.agenciamidas.com`
- Health: `{"status":"ok"}` ✅

## 🔍 Verificar Frontend

### 1. Variáveis de Ambiente do Frontend

No Coolify, verifique se o frontend tem:

```
NEXT_PUBLIC_API_URL=https://x0k0gkcgws8w0cw0oocsg8c0.agenciamidas.com/api
```

**Importante:**
- Use `/api` no final (sem barra extra)
- Use `https://` (não `http://`)
- Não coloque barra no final

### 2. Testar Frontend

Acesse a URL do frontend:
```
https://r8w848oc4c8kcww40k04gw8s.agenciamidas.com
```

### 3. Testar Login

Use as credenciais padrão:
- **Email**: `admin@example.com`
- **Senha**: `admin123`

**Nota**: Se não conseguir fazer login, pode ser que o seed não tenha sido executado. Execute:

```bash
# No terminal do Coolify (backend)
cd backend
npm run seed
```

### 4. Verificar CORS

Se houver erro de CORS no console do navegador, verifique se no backend:
```
CORS_ORIGIN=https://r8w848oc4c8kcww40k04gw8s.agenciamidas.com
```

## 🎯 Checklist Final

- [x] Backend rodando e respondendo
- [ ] Frontend configurado com `NEXT_PUBLIC_API_URL` correto
- [ ] Frontend acessível
- [ ] Login funcionando
- [ ] Dashboard carregando dados

## 🐛 Problemas Comuns

### Frontend não conecta ao backend
- Verifique `NEXT_PUBLIC_API_URL` no frontend
- Verifique `CORS_ORIGIN` no backend
- Use HTTPS em ambas as URLs

### Erro 401 ao fazer login
- Execute `npm run seed` no backend
- Verifique se o usuário admin foi criado

### Erro de CORS
- Adicione a URL do frontend em `CORS_ORIGIN` do backend
- Reinicie o backend após alterar
