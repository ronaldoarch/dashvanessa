# Diagnóstico - Frontend Bad Gateway

## Problema
Frontend mostra "Bad Gateway" mesmo após deploy bem-sucedido.

## Checklist de Diagnóstico

### 1. ✅ Verificar Status do Container

No Coolify:
- Vá até o serviço do **frontend**
- Verifique o status: deve estar **"Running"** (verde)
- Se estiver "Stopped" ou "Error", clique em **"Restart"**

### 2. ✅ Verificar Logs do Frontend

No Coolify, clique em **"Logs"** do frontend e procure por:

**✅ Sinais de sucesso:**
- `Ready in X.Xs` - Frontend iniciou
- `Local: http://localhost:3000` - Servidor rodando
- Sem erros de crash

**❌ Sinais de problema:**
- `Error: listen EADDRINUSE` - Porta já em uso
- `Error: Cannot find module` - Dependência faltando
- Container crashando repetidamente

### 3. ✅ Verificar Porta no Coolify

No Coolify, vá em **Settings** do frontend:
- **Port**: Deve estar configurado como `3000`
- **Expose Port**: Deve estar **marcado** ✅
- Se estiver diferente, altere para `3000` e faça redeploy

### 4. ✅ Verificar Variável de Ambiente PORT

No Coolify, verifique se há uma variável `PORT` configurada:
- Se existir e estiver como `3001`, **delete** ou altere para `3000`
- O Dockerfile já define `PORT=3000`, mas o Coolify pode estar sobrescrevendo

### 5. ✅ Testar Container Diretamente

Se possível, execute no terminal do Coolify:

```bash
# Verificar se o container está rodando
docker ps | grep r8w848oc4c8kcww40k04gw8s

# Ver logs em tempo real
docker logs -f <container-id>
```

### 6. ✅ Verificar Health Check

O Next.js não tem um endpoint `/health` por padrão, mas você pode testar:

```
https://r8w848oc4c8kcww40k04gw8s.agenciamidas.com
```

Se ainda mostrar "Bad Gateway", o problema é na configuração do Coolify ou no container.

## Soluções Comuns

### Solução 1: Porta Incorreta

**Problema**: Coolify está usando porta errada

**Solução**:
1. Vá em **Settings** do frontend
2. Altere **Port** para `3000`
3. Marque **Expose Port**
4. Faça **Redeploy**

### Solução 2: Variável PORT Conflitante

**Problema**: Variável `PORT=3001` está sobrescrevendo

**Solução**:
1. Vá em **Settings > Environment Variables** do frontend
2. Procure por `PORT`
3. Se existir e não for `3000`, **delete** ou altere para `3000`
4. Faça **Redeploy**

### Solução 3: Container Não Inicia

**Problema**: Container crasha ao iniciar

**Solução**:
1. Veja os logs do frontend
2. Identifique o erro
3. Corrija o problema
4. Faça **Redeploy**

### Solução 4: Next.js Não Inicia

**Problema**: Next.js não consegue iniciar

**Solução**:
1. Verifique se o build foi bem-sucedido
2. Verifique se `NEXT_PUBLIC_API_URL` está configurado
3. Verifique logs para erros específicos

## Comandos Úteis

```bash
# Ver status do container
docker ps -a | grep frontend

# Ver logs do container
docker logs <container-id>

# Entrar no container
docker exec -it <container-id> sh

# Verificar se a porta está escutando
netstat -tuln | grep 3000
```

## Próximos Passos

1. ✅ Verifique os logs do frontend no Coolify
2. ✅ Confirme que a porta está como `3000`
3. ✅ Verifique se não há variável `PORT` conflitante
4. ✅ Compartilhe os logs se o problema persistir
