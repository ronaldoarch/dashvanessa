# Guia de Deploy no Coolify

## Estrutura do Projeto

Este projeto tem **backend** e **frontend** separados. Você precisará criar **2 aplicações** no Coolify:

1. **Backend** (API Node.js/Express)
2. **Frontend** (Next.js)

## 1. Deploy do Backend

### Configuração da Aplicação Backend

1. No Coolify, clique em "Create a new Application"
2. Preencha:
   - **Repository URL**: `https://github.com/ronaldoarch/dashvanessa`
   - **Branch**: `main`
   - **Build Pack**: `Nixpacks` (ou `Dockerfile` se preferir)
   - **Base Directory**: `/backend`
   - **Port**: `3001`
   - **Is it a static site?**: ❌ NÃO marque

3. Clique em "Continue"

### Variáveis de Ambiente do Backend

Adicione estas variáveis de ambiente:

```
NODE_ENV=production
DATABASE_URL=<sua_url_do_postgresql>
JWT_SECRET=<gere_uma_chave_secreta_aleatória>
PORT=3001
CORS_ORIGIN=https://<url-do-frontend>.coolify.app
OTG_API_KEY=<sua_chave_da_api_otg>
OTG_API_BASE_URL=https://api-partners.grupootg.com/api/v1
```

### Build Command (se necessário)

Se o Nixpacks não detectar automaticamente, adicione:

```bash
cd backend && npm install && npx prisma generate && npx prisma migrate deploy
```

### Start Command

```bash
cd backend && npm start
```

**Nota**: Certifique-se de que o `package.json` do backend tem o script `start` configurado.

## 2. Deploy do Frontend

### Configuração da Aplicação Frontend

1. Crie outra aplicação no Coolify
2. Preencha:
   - **Repository URL**: `https://github.com/ronaldoarch/dashvanessa`
   - **Branch**: `main`
   - **Build Pack**: `Nixpacks`
   - **Base Directory**: `/frontend`
   - **Port**: `3000`
   - **Is it a static site?**: ❌ NÃO marque (Next.js precisa de servidor Node)

### Variáveis de Ambiente do Frontend

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://<url-do-backend>.coolify.app/api
```

### Build Command

```bash
cd frontend && npm install && npm run build
```

### Start Command

```bash
cd frontend && npm start
```

## 3. Banco de Dados PostgreSQL

### Criar Banco de Dados no Coolify

1. No Coolify, vá em "Resources" → "PostgreSQL"
2. Crie um novo banco de dados
3. Anote a **Internal URL** (use esta no backend)
4. Configure:
   - **Database Name**: `dashvanessa`
   - **User**: `dashvanessa_user`
   - **Password**: (gerado automaticamente)

### Executar Migrations

Após o deploy do backend, execute as migrations:

1. Acesse o terminal do backend no Coolify
2. Execute:
```bash
cd backend
npx prisma migrate deploy
npm run seed
```

Ou adicione ao build command:
```bash
cd backend && npm install && npx prisma generate && npx prisma migrate deploy && npm run seed
```

## 4. Configuração de CORS

No backend, certifique-se de que `CORS_ORIGIN` aponta para a URL correta do frontend:

```
CORS_ORIGIN=https://dashvanessa-frontend.coolify.app
```

## 5. Ordem de Deploy

1. ✅ Criar banco de dados PostgreSQL
2. ✅ Deploy do Backend (com DATABASE_URL configurado)
3. ✅ Executar migrations e seed
4. ✅ Deploy do Frontend (com NEXT_PUBLIC_API_URL apontando para o backend)

## Troubleshooting

### Erro de Build no Backend
- Verifique se o `Base Directory` está como `/backend`
- Confirme que o `package.json` tem o script `start`
- Verifique os logs de build no Coolify

### Erro de Conexão com Banco
- Use a **Internal URL** do PostgreSQL (não a externa)
- Confirme que as migrations foram executadas
- Verifique se o banco está rodando

### Erro de CORS
- Confirme que `CORS_ORIGIN` no backend tem a URL correta do frontend
- Não coloque barra no final da URL
- Verifique se ambas as aplicações estão rodando

### Frontend não conecta ao Backend
- Verifique se `NEXT_PUBLIC_API_URL` está correto
- Confirme que o backend está acessível
- Verifique os logs do frontend para erros de conexão

## URLs de Exemplo

- **Backend**: `https://dashvanessa-backend.coolify.app`
- **Frontend**: `https://dashvanessa-frontend.coolify.app`
- **API Endpoint**: `https://dashvanessa-backend.coolify.app/api`

## Notas Importantes

- O Coolify pode usar domínios customizados
- Configure SSL/HTTPS automaticamente
- Monitore os logs de ambas as aplicações
- Mantenha as variáveis de ambiente seguras
