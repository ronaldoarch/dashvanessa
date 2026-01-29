# Correção: Colunas de Links Sociais Faltando no Banco de Dados

## Problema

O erro mostra que as colunas `instagramLink`, `facebookLink` e `telegramLink` não existem na tabela `affiliates`:

```
The column `affiliates.instagramLink` does not exist in the current database.
```

Isso causa erros em:
- Login (`/api/auth/login`)
- Sincronização OTG (`syncResults`)
- Qualquer operação que busque dados de afiliados

## Causa

As migrations do Prisma não foram executadas no banco de dados de produção. A migration `20260129190725_add_social_links` existe mas não foi aplicada.

## Solução Implementada

### 1. Execução Automática de Migrations

Adicionado script `start:migrate` no `package.json` que executa migrations antes de iniciar o servidor:

```json
"start:migrate": "npx prisma migrate deploy && node dist/index.js"
```

### 2. Dockerfile Atualizado

O Dockerfile agora usa o script `start:migrate` que executa migrations automaticamente:

```dockerfile
CMD ["npm", "run", "start:migrate"]
```

### 3. Prisma CLI em Dependencies

O Prisma CLI foi movido de `devDependencies` para `dependencies` para estar disponível em produção.

## Como Aplicar a Correção

### Opção 1: Deploy Automático (Recomendado)

Fazer um novo deploy. O backend agora executará migrations automaticamente na inicialização.

### Opção 2: Execução Manual

Se precisar aplicar imediatamente sem fazer deploy:

1. Acesse o terminal do backend no Coolify
2. Execute:

```bash
cd backend
npx prisma migrate deploy
```

### Verificar se Funcionou

Após aplicar, verifique os logs do backend. Você deve ver:
- ✅ Migrations aplicadas com sucesso
- ✅ Login funcionando sem erros
- ✅ Sincronização OTG funcionando

## Migrations Pendentes

A migration que precisa ser aplicada:

**`20260129190725_add_social_links`**
- Adiciona colunas: `facebookLink`, `instagramLink`, `telegramLink` na tabela `affiliates`

## Nota Importante

⚠️ **Execute as migrations ANTES de usar o sistema!** Sem elas, o sistema não funcionará corretamente porque o schema do banco não corresponde ao código.
