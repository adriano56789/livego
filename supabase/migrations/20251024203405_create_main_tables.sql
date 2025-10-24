/*
  # Criação das Tabelas Principais - LiveGo App

  ## Tabelas Criadas
  
  1. **users** - Usuários da plataforma
     - id (uuid, pk)
     - identification (text)
     - name (text)
     - avatar_url (text)
     - cover_url (text)
     - country (text)
     - age (int)
     - gender (text)
     - level (int)
     - xp (int)
     - fans (int)
     - following (int)
     - receptores (int)
     - enviados (int)
     - diamonds (int)
     - earnings (int)
     - earnings_withdrawn (int)
     - bio (text)
     - is_vip (boolean)
     - is_online (boolean)
     - last_seen (timestamptz)
     - created_at (timestamptz)
     - updated_at (timestamptz)

  2. **streamers** - Transmissões ao vivo
     - id (uuid, pk)
     - host_id (uuid, fk -> users)
     - location (text)
     - message (text)
     - tags (text[])
     - is_hot (boolean)
     - country (text)
     - viewers (int)
     - is_private (boolean)
     - quality (text)
     - created_at (timestamptz)

  3. **gifts** - Presentes disponíveis
     - id (uuid, pk)
     - name (text)
     - price (int)
     - icon (text)
     - category (text)
     - triggers_auto_follow (boolean)
     - video_url (text)

  4. **gift_transactions** - Histórico de presentes enviados
     - id (uuid, pk)
     - from_user_id (uuid, fk -> users)
     - to_user_id (uuid, fk -> users)
     - stream_id (uuid, fk -> streamers)
     - gift_name (text)
     - amount (int)
     - created_at (timestamptz)

  5. **relationships** - Seguidores/Seguindo
     - id (uuid, pk)
     - follower_id (uuid, fk -> users)
     - followed_id (uuid, fk -> users)
     - created_at (timestamptz)

  6. **messages** - Mensagens entre usuários
     - id (uuid, pk)
     - from_user_id (uuid, fk -> users)
     - to_user_id (uuid, fk -> users)
     - text (text)
     - image_url (text)
     - is_read (boolean)
     - created_at (timestamptz)

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Políticas de acesso básicas criadas
*/

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identification text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  cover_url text,
  country text DEFAULT 'br',
  age int,
  gender text DEFAULT 'not_specified',
  level int DEFAULT 1,
  xp int DEFAULT 0,
  fans int DEFAULT 0,
  following int DEFAULT 0,
  receptores int DEFAULT 0,
  enviados int DEFAULT 0,
  diamonds int DEFAULT 0,
  earnings int DEFAULT 0,
  earnings_withdrawn int DEFAULT 0,
  bio text DEFAULT '',
  is_vip boolean DEFAULT false,
  is_online boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de streamers/transmissões
CREATE TABLE IF NOT EXISTS streamers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES users(id) ON DELETE CASCADE,
  location text DEFAULT 'Em algum lugar',
  message text DEFAULT '',
  tags text[] DEFAULT '{}',
  is_hot boolean DEFAULT false,
  country text DEFAULT 'br',
  viewers int DEFAULT 0,
  is_private boolean DEFAULT false,
  quality text DEFAULT 'auto',
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de presentes
CREATE TABLE IF NOT EXISTS gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  price int DEFAULT 0,
  icon text NOT NULL,
  category text NOT NULL,
  triggers_auto_follow boolean DEFAULT false,
  video_url text
);

-- Criar tabela de transações de presentes
CREATE TABLE IF NOT EXISTS gift_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  to_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stream_id uuid REFERENCES streamers(id) ON DELETE SET NULL,
  gift_name text NOT NULL,
  amount int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de relacionamentos (seguir/seguidores)
CREATE TABLE IF NOT EXISTS relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES users(id) ON DELETE CASCADE,
  followed_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, followed_id)
);

-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  to_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  text text DEFAULT '',
  image_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE streamers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas para users (todos podem ler, apenas o próprio usuário pode editar)
CREATE POLICY "Users são visíveis para todos"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users podem atualizar próprio perfil"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Políticas para streamers (todos podem ler transmissões públicas)
CREATE POLICY "Streamers públicos são visíveis"
  ON streamers FOR SELECT
  TO authenticated
  USING (is_private = false OR host_id = auth.uid());

CREATE POLICY "Host pode gerenciar própria stream"
  ON streamers FOR ALL
  TO authenticated
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- Políticas para gifts (todos podem ler)
CREATE POLICY "Gifts são visíveis para todos"
  ON gifts FOR SELECT
  TO authenticated
  USING (true);

-- Políticas para gift_transactions
CREATE POLICY "Usuários podem ver presentes enviados/recebidos"
  ON gift_transactions FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Usuários podem enviar presentes"
  ON gift_transactions FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

-- Políticas para relationships
CREATE POLICY "Usuários podem ver relacionamentos"
  ON relationships FOR SELECT
  TO authenticated
  USING (follower_id = auth.uid() OR followed_id = auth.uid());

CREATE POLICY "Usuários podem seguir outros"
  ON relationships FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Usuários podem deixar de seguir"
  ON relationships FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

-- Políticas para messages
CREATE POLICY "Usuários podem ver próprias mensagens"
  ON messages FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Usuários podem enviar mensagens"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar mensagens recebidas"
  ON messages FOR UPDATE
  TO authenticated
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_streamers_host_id ON streamers(host_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_from_user ON gift_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_to_user ON gift_transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_follower ON relationships(follower_id);
CREATE INDEX IF NOT EXISTS idx_relationships_followed ON relationships(followed_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_users_identification ON users(identification);
