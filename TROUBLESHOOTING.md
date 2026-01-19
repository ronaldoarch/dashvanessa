# Guia de Troubleshooting - Deploy no Coolify

## Erro "Bad Gateway" (502)

Este erro geralmente significa que o Coolify não consegue se conectar ao seu container. Siga estes passos:

### 1. Verificar se o Backend está Rodando

No Coolify, vá até o serviço do backend e verifique:
- Status do container (deve estar "Running")
- Logs do container (clique em "Logs" ou "Show Debug Logs")

### 2. Verificar Logs do Backend

Procure por erros comuns:

#### Erro de Conexão com Banco de Dados
```
Error: Can't reach database server
```
**Solução**: Verifique se `DATABASE_URL` está configurada corretamente e se o banco está acessível.

#### Erro de Migrations
```
Error: Migration failed
```
**Solução**: Execute as migrations manualmente:
```bash
# Via terminal do Coolify ou SSH
cd backend
npx prisma migrate deploy
```

#### Erro de Porta
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solução**: Verifique se a porta 3001 está configurada corretamente no Coolify.

### 3. Verificar Variáveis de Ambiente

Certifique-se de que todas estas variáveis estão configuradas:

**Backend:**
```
NODE_ENV=production (Runtime only)
DATABASE_URL=<url_do_postgresql>
JWT_SECRET=<sua_chave_secreta>
PORT=3001
CORS_ORIGIN=https://<url-do-frontend>
OTG_API_KEY=<opcional>
OTG_API_BASE_URL=https://api-partners.grupootg.com/api/v1
```

**Frontend:**
```
NODE_ENV=production (Runtime only)
NEXT_PUBLIC_API_URL=https://<url-do-backend>/api
```

### 4. Verificar Health Check

O backend deve responder em `/api/health` ou similar. Teste:

```bash
curl https://<url-do-backend>/api/config
```

### 5. Executar Migrations e Seed

Após o deploy do backend, execute:

```bash
# Via terminal do Coolify
cd backend
npx prisma generate
npx prisma migrate deploy
npm run seed
```

### 6. Verificar Ordem de Deploy

1. ✅ Criar banco de dados PostgreSQL
2. ✅ Deploy do Backend
3. ✅ Executar migrations e seed
4. ✅ Verificar se backend está respondendo
5. ✅ Deploy do Frontend

### 7. Problemas Comuns

#### Backend não inicia
- Verifique os logs
- Confirme que todas as variáveis de ambiente estão configuradas
- Verifique se o banco de dados está acessível

#### Frontend mostra "Bad Gateway"
- Verifique se o backend está rodando
- Confirme que `NEXT_PUBLIC_API_URL` aponta para o backend correto
- Verifique se `CORS_ORIGIN` no backend inclui a URL do frontend

#### Erro de CORS
- Adicione a URL do frontend em `CORS_ORIGIN` do backend
- Use HTTPS em ambas as URLs
- Não coloque barra no final das URLs

### 8. Comandos Úteis

```bash
# Ver logs do backend
docker logs <container-id>

# Testar conexão com banco
psql $DATABASE_URL

# Verificar se porta está aberta
netstat -tuln | grep 3001

# Reiniciar serviço
# No Coolify: Settings > Restart
```

## Erro de Certificado SSL

Se você ver `ERR_CERT_AUTHORITY_INVALID`:
- O Coolify gera certificados SSL automaticamente
- Aguarde alguns minutos após o deploy
- Verifique se o domínio está configurado corretamente

## Erro de Server Actions (Next.js)

Os erros de Server Actions não são críticos se você não estiver usando Server Actions. Eles aparecem nos logs mas não impedem o funcionamento da aplicação.
