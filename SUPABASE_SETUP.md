# Configuração do Supabase - LiveGo App

Este guia mostra como conectar seu app ao banco de dados Supabase.

## ✅ O que já foi feito

1. **Banco de dados criado** no Supabase com as seguintes tabelas:
   - `users` - Usuários da plataforma
   - `streamers` - Transmissões ao vivo
   - `gifts` - Presentes disponíveis
   - `gift_transactions` - Histórico de presentes enviados
   - `relationships` - Relacionamentos (seguir/seguidores)
   - `messages` - Mensagens entre usuários

2. **Políticas de segurança (RLS)** configuradas em todas as tabelas

3. **Cliente Supabase instalado**: `@supabase/supabase-js`

4. **Variáveis de ambiente** configuradas no `.env`:
   ```
   VITE_SUPABASE_URL=sua_url
   VITE_SUPABASE_ANON_KEY=sua_chave
   ```

5. **Arquivos criados**:
   - `services/supabase.ts` - Cliente e helpers do Supabase
   - `services/api-supabase.ts` - API adaptada para usar Supabase

## 🚀 Como usar

### Opção 1: Substituir API completamente

No arquivo onde você importa a API (`services/api.ts`), substitua pelo Supabase:

```typescript
// Antes:
import { api } from './services/api';

// Depois:
import { api } from './services/api-supabase';
```

### Opção 2: Usar diretamente os helpers

Você pode usar os helpers do Supabase diretamente:

```typescript
import { supabaseHelpers } from './services/supabase';

// Exemplo: Buscar usuário
const user = await supabaseHelpers.getUser('user-id');

// Exemplo: Criar stream
const stream = await supabaseHelpers.createStream({
  host_id: 'user-id',
  message: 'Olá pessoal!',
  country: 'br'
});

// Exemplo: Enviar presente
await supabaseHelpers.sendGift(
  'from-user-id',
  'to-user-id',
  'stream-id',
  'Coração',
  5
);
```

## 📊 Estrutura do Banco de Dados

### Tabela `users`
```sql
id                  uuid (PK)
identification      text (unique)
name               text
avatar_url         text
diamonds           int
earnings           int
fans               int
following          int
is_online          boolean
created_at         timestamptz
```

### Tabela `streamers`
```sql
id           uuid (PK)
host_id      uuid (FK -> users)
message      text
tags         text[]
viewers      int
is_private   boolean
created_at   timestamptz
```

### Tabela `gifts`
```sql
id                    uuid (PK)
name                 text (unique)
price                int
icon                 text
category             text
triggers_auto_follow boolean
```

### Tabela `gift_transactions`
```sql
id            uuid (PK)
from_user_id  uuid (FK -> users)
to_user_id    uuid (FK -> users)
stream_id     uuid (FK -> streamers)
gift_name     text
amount        int
created_at    timestamptz
```

### Tabela `relationships`
```sql
id           uuid (PK)
follower_id  uuid (FK -> users)
followed_id  uuid (FK -> users)
created_at   timestamptz
```

### Tabela `messages`
```sql
id            uuid (PK)
from_user_id  uuid (FK -> users)
to_user_id    uuid (FK -> users)
text          text
image_url     text
is_read       boolean
created_at    timestamptz
```

## 🔐 Segurança (RLS - Row Level Security)

Todas as tabelas têm políticas de segurança configuradas:

- **users**: Todos podem ler, apenas o próprio usuário pode editar
- **streamers**: Todos podem ver streams públicas, apenas o host pode gerenciar
- **gifts**: Todos podem ler
- **gift_transactions**: Usuários veem apenas presentes enviados/recebidos
- **relationships**: Usuários veem apenas próprios relacionamentos
- **messages**: Usuários veem apenas próprias mensagens

## 📝 Dados Iniciais

Alguns presentes já foram inseridos no banco:
- Coração (1 diamante)
- Café (3 diamantes)
- Rosa (5 diamantes)
- Pizza (35 diamantes)
- Coroa (5000 diamantes)
- Foguete (500 diamantes)
- Jato Privado (600 diamantes)
- Castelo (2000 diamantes)

## 🔄 Migração dos Dados Locais

Se você tem dados no banco local (localStorage) e quer migrar para o Supabase, você pode:

1. Exportar os dados do localStorage
2. Usar os helpers do Supabase para inserir no banco
3. Exemplo:

```typescript
import { supabaseHelpers } from './services/supabase';
import { db } from './services/database';

// Migrar usuários
for (const [id, user] of db.users) {
  await supabaseHelpers.createUser({
    identification: user.identification,
    name: user.name,
    avatar_url: user.avatarUrl,
    diamonds: user.diamonds,
    // ... outros campos
  });
}
```

## 🐛 Debug

Para verificar se a conexão está funcionando:

```typescript
import { supabase } from './services/supabase';

// Testar conexão
const { data, error } = await supabase
  .from('users')
  .select('count')
  .single();

console.log('Conexão Supabase:', error ? 'Erro' : 'OK', data);
```

## 📚 Próximos Passos

1. Implementar autenticação com Supabase Auth
2. Adicionar realtime para mensagens e streamers
3. Implementar upload de imagens para o Supabase Storage
4. Adicionar mais tabelas conforme necessário (blocklist, visits, etc.)

## 🆘 Suporte

Se encontrar problemas, verifique:
1. As variáveis de ambiente no `.env`
2. As políticas RLS no Supabase Dashboard
3. Os logs de erro no console do navegador
