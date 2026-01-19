# Executar Migrations - Solução Urgente

## Problema

Os erros mostram que as tabelas não existem no banco de dados:
- `The table 'public.system_configs' does not exist`
- `The table 'public.users' does not exist`

## Solução: Executar Migrations

### No Coolify - Terminal do Backend

1. No Coolify, vá até o serviço do **backend**
2. Clique em **"Terminal"** ou **"Shell"**
3. Execute os seguintes comandos:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npm run seed
```

### Explicação dos Comandos

1. **`npx prisma generate`**: Gera o Prisma Client atualizado
2. **`npx prisma migrate deploy`**: Executa todas as migrations pendentes no banco
3. **`npm run seed`**: Cria o usuário admin e configurações iniciais

### Após Executar

Após executar os comandos, você deve ver:
- ✅ Migrations aplicadas com sucesso
- ✅ Usuário admin criado
- ✅ Configurações iniciais criadas

### Verificar se Funcionou

Teste o login novamente:
- Email: `admin@example.com`
- Senha: `admin123`

Os erros devem desaparecer dos logs.

## Importante

**Execute as migrations ANTES de usar o sistema!** Sem elas, nenhuma funcionalidade vai funcionar porque as tabelas não existem.
