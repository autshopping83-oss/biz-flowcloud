-- ============================================
-- RLS: Row Level Security — Isolamento por utilizador
-- Executar no SQL Editor do Supabase Dashboard
-- ============================================

-- 1. Activar RLS em todas as tabelas
ALTER TABLE documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_clients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens      ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- 2. Políticas: cada user só vê os SEUS dados

-- Documents
DROP POLICY IF EXISTS "user_isolation" ON documents;
CREATE POLICY "user_isolation" ON documents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Saved Clients
DROP POLICY IF EXISTS "user_isolation" ON saved_clients;
CREATE POLICY "user_isolation" ON saved_clients
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Saved Products
DROP POLICY IF EXISTS "user_isolation" ON saved_products;
CREATE POLICY "user_isolation" ON saved_products
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Transactions
DROP POLICY IF EXISTS "user_isolation" ON transactions;
CREATE POLICY "user_isolation" ON transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Profiles (id = user UUID)
DROP POLICY IF EXISTS "user_isolation" ON profiles;
CREATE POLICY "user_isolation" ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User Tokens
DROP POLICY IF EXISTS "user_isolation" ON user_tokens;
CREATE POLICY "user_isolation" ON user_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
