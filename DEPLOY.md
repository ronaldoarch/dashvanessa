# Guia de Deploy no Colify (Render)

## Pré-requisitos

1. Conta no [Render](https://render.com)
2. Repositório GitHub conectado
3. Banco de dados PostgreSQL (pode usar o PostgreSQL do Render)

## Passos para Deploy

### 1. Criar Banco de Dados PostgreSQL

1. No dashboard do Render, clique em "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `dashvanessa-db`
   - **Database**: `dashvanessa`
   - **User**: `dashvanessa_user`
   - **Plan**: Free (ou pago conforme necessidade)
3. Anote a **Internal Database URL** e **External Database URL**

### 2. Deploy do Backend

1. No dashboard do Render, clique em "New +" → "Web Service"
2. Conecte o repositório GitHub: `ronaldoarch/dashvanessa`
3. Configure:
   - **Name**: `dashvanessa-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm start` (ou `npm run dev` para desenvolvimento)
   - **Plan**: Free

4. Adicione as variáveis de ambiente:
   ```
   NODE_ENV=production
   DATABASE_URL=<Internal Database URL do passo 1>
   JWT_SECRET=<gere uma chave secreta aleatória>
   PORT=3001
   CORS_ORIGIN=https://dashvanessa-frontend.onrender.com
   OTG_API_KEY=<sua chave da API OTG>
   OTG_API_BASE_URL=https://api-partners.grupootg.com/api/v1
   ```

### 3. Deploy do Frontend

1. No dashboard do Render, clique em "New +" → "Web Service"
2. Conecte o mesmo repositório GitHub
3. Configure:
   - **Name**: `dashvanessa-frontend`
   - **Environment**: `Node`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Adicione as variáveis de ambiente:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://dashvanessa-backend.onrender.com/api
   ```

### 4. Executar Migrations e Seed

Após o deploy do backend, execute via SSH ou adicione um script:

```bash
# Via Render Shell ou SSH
cd backend
npx prisma migrate deploy
npm run seed
```

Ou adicione ao build command:
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run seed
```

### 5. Configurar Domínios Customizados (Opcional)

1. No serviço do frontend, vá em "Settings" → "Custom Domains"
2. Adicione seu domínio
3. Configure o DNS conforme instruções do Render

## Variáveis de Ambiente Necessárias

### Backend
- `DATABASE_URL` - URL de conexão do PostgreSQL
- `JWT_SECRET` - Chave secreta para JWT (gere uma aleatória)
- `PORT` - Porta do servidor (padrão: 3001)
- `CORS_ORIGIN` - URL do frontend para CORS
- `OTG_API_KEY` - Chave da API OTG Partners
- `OTG_API_BASE_URL` - URL base da API OTG (opcional)

### Frontend
- `NEXT_PUBLIC_API_URL` - URL completa da API do backend

## Troubleshooting

### Erro de Conexão com Banco de Dados
- Verifique se está usando a **Internal Database URL** no backend
- Confirme que o banco está rodando
- Verifique se as migrations foram executadas

### Erro de Build
- Verifique os logs de build no Render
- Confirme que todas as dependências estão no `package.json`
- Verifique se o Node.js version está correto

### CORS Error
- Confirme que `CORS_ORIGIN` no backend aponta para a URL correta do frontend
- Verifique se a URL não tem barra no final

## Comandos Úteis

```bash
# Ver logs do backend
render logs dashvanessa-backend

# Ver logs do frontend
render logs dashvanessa-frontend

# Executar migrations manualmente
render shell dashvanessa-backend
cd backend
npx prisma migrate deploy
```

## Notas Importantes

- O plano **Free** do Render coloca os serviços em sleep após inatividade
- Para produção, considere usar planos pagos
- Use **Internal Database URL** para melhor performance
- Mantenha as variáveis de ambiente seguras e não as commite no código
