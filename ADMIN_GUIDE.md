# 📋 Guia do Administrador

## 🎯 Acesso ao Painel Administrativo

Como administrador, você tem acesso a uma página especial para gerenciar afiliados.

### Como Acessar

1. Faça login como admin: `admin@example.com` / `admin123`
2. No dashboard, clique no botão **"Admin"** no topo direito
3. Ou acesse diretamente: http://localhost:3000/admin

## 🔧 Funcionalidades Disponíveis

### 1. Visualizar Todos os Afiliados

Na página `/admin`, você verá uma tabela com:
- **Nome e Email** de cada afiliado
- **ID Externo** (se houver)
- **Deal Atual** associado
- **Valores de CPA e RevShare** do deal
- **Ações** disponíveis

### 2. Ver Credenciais de Login

Para cada afiliado, você pode:
- Clicar em **"Ver Login"**
- Ver o **email** do afiliado
- **Redefinir a senha** (opcional)

**Nota**: Por segurança, a senha atual não é exibida, mas você pode definir uma nova.

### 3. Associar/Trocar Deal

Para definir o CPA de um afiliado:

1. Clique em **"Associar Deal"** ou **"Trocar Deal"**
2. Escolha um deal da lista
3. O deal será associado imediatamente
4. Os valores aparecerão no dashboard do afiliado

### 4. Remover Deal

- Clique em **"Remover Deal"** para remover a associação
- O afiliado voltará a usar os valores padrão do sistema

## 📊 Diferença entre Admin e Afiliado

### Painel do Admin (`/admin`)
- ✅ Vê **todos** os afiliados cadastrados
- ✅ Pode ver credenciais de qualquer afiliado
- ✅ Pode associar/trocar deals
- ✅ Gerencia todo o sistema

### Dashboard do Admin (`/dashboard`)
- ✅ Vê métricas gerais de todos os afiliados
- ✅ Vê todos os afiliados na tabela "Meus Indicados"
- ✅ Não vê card de link de indicação

### Dashboard do Afiliado (`/dashboard`)
- ✅ Vê apenas **seus indicados** (quem ele indicou via link)
- ✅ Vê seu próprio link de indicação
- ✅ Vê métricas apenas dos seus indicados
- ✅ Não pode ver credenciais de outros

## 🔐 Credenciais dos Afiliados

### Como Obter

1. Acesse `/admin`
2. Na tabela, clique em **"Ver Login"** no afiliado desejado
3. O modal mostrará:
   - **Email**: Credencial de login
   - **Campo de senha**: Para redefinir (opcional)

### Exemplo de Credenciais

```
Email: afiliado@teste.com
Senha: (pode ser redefinida)
```

## 💰 Definir CPA e RevShare

### Método 1: Via Deals (Recomendado)

1. Crie um deal com os valores desejados:
```bash
./test_deal.sh
# Ou via API
```

2. No painel admin (`/admin`), clique em **"Associar Deal"**
3. Escolha o deal criado
4. Pronto! O afiliado verá os novos valores

### Método 2: Valores Padrão

Se o afiliado não tiver deal associado, ele usa os valores padrão:
- CPA: R$ 300 (configurável em `/api/config`)
- RevShare: 25% (configurável em `/api/config`)

## 📝 Exemplo de Uso Completo

### Cenário: Criar afiliado e definir CPA personalizado

1. **Criar usuário afiliado** (via API ou script):
```bash
./create_affiliate.sh
```

2. **Criar deal personalizado**:
```bash
./test_deal.sh
```

3. **Acessar `/admin`** no navegador

4. **Associar deal ao afiliado**:
   - Clique em "Associar Deal"
   - Escolha o deal criado

5. **Ver credenciais**:
   - Clique em "Ver Login"
   - Anote o email
   - Defina uma senha se necessário

6. **Pronto!** O afiliado pode fazer login e verá os valores do deal

## 🎨 Interface do Admin

A página `/admin` possui:
- **Tabela completa** com todos os afiliados
- **Modais interativos** para ações
- **Visualização clara** de deals e valores
- **Ações rápidas** (associar, remover, ver login)

## 🔄 Fluxo Completo

```
Admin cria Deal → Admin associa Deal ao Afiliado → 
Afiliado faz login → Vê valores do Deal no dashboard →
Afiliado compartilha link → Novos cadastros aparecem em "Meus Indicados"
```

## 📍 Localização das Funcionalidades

- **Ver credenciais**: Botão "Ver Login" na tabela `/admin`
- **Definir CPA**: Botão "Associar Deal" na tabela `/admin`
- **Criar deals**: Via API `/api/deals` ou script `./test_deal.sh`
- **Gerenciar afiliados**: Página `/admin`

Tudo está centralizado na página `/admin` para facilitar o gerenciamento!
