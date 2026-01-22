# Explicação sobre Webhook

## O que é um Webhook?

Um **webhook** é uma forma de comunicação entre sistemas onde um sistema (Superbet) **notifica automaticamente** outro sistema (seu backend) quando algo acontece.

## Como Funciona no Nosso Sistema?

### Fluxo SEM Webhook (Manual):
1. Admin cria convite
2. Afiliado se cadastra
3. Sistema envia dados para Superbet
4. Superbet aprova (mas nosso sistema não sabe)
5. **Admin precisa clicar no botão 🔄 manualmente** para verificar se foi aprovado

### Fluxo COM Webhook (Automático):
1. Admin cria convite
2. Afiliado se cadastra
3. Sistema envia dados para Superbet
4. Superbet aprova
5. **Superbet envia webhook automaticamente** para nosso backend
6. Sistema recebe a notificação e atualiza tudo automaticamente
7. Admin vê o status atualizado sem precisar fazer nada

## Como Configurar o Webhook?

### 1. No Painel da Superbet:
Você precisa configurar o webhook para apontar para seu backend:

```
URL do Webhook: https://seu-backend.com/api/invites/webhook/superbet
Método: POST
Header: X-Webhook-Token: {SUPERBET_WEBHOOK_TOKEN}
```

### 2. No Seu Backend (Coolify):
Configure a variável de ambiente:

```
SUPERBET_WEBHOOK_TOKEN=seu_token_secreto_aqui
```

**Importante:** Use um token forte e secreto! Este token protege o webhook de acessos não autorizados.

## O que o Webhook Envia?

Quando a Superbet aprova um afiliado, ela envia:

```json
{
  "requestId": "req_123456",
  "affiliateId": "aff_123456",
  "affiliateLink": "https://superbet.com/affiliate/...",
  "status": "approved"
}
```

## O que Nosso Sistema Faz com o Webhook?

1. **Valida o token** - Verifica se é realmente da Superbet
2. **Busca o convite** - Encontra o convite pelo `requestId`
3. **Cria usuário e afiliado** - Se ainda não existir
4. **Atualiza informações** - Adiciona o link da Superbet
5. **Marca como aprovado** - Atualiza o status do convite

## Vantagens do Webhook

✅ **Automático** - Não precisa verificar manualmente
✅ **Tempo real** - Atualiza assim que a Superbet aprovar
✅ **Menos trabalho** - Admin não precisa ficar clicando no botão 🔄
✅ **Mais confiável** - Não depende de você lembrar de verificar

## Se Não Configurar o Webhook?

Não tem problema! O sistema continua funcionando:
- Você pode usar o botão 🔄 para verificar manualmente
- O sistema funciona normalmente
- Apenas não será automático

## Resumo Simples

**Webhook = Superbet avisa automaticamente quando aprovar um afiliado**

Sem webhook = Você precisa verificar manualmente
Com webhook = Sistema atualiza automaticamente
