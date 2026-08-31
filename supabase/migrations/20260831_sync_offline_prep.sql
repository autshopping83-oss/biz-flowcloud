-- ============================================================
-- MIGRATION 2: PREPARAÇÃO PARA SINCRONIZAÇÃO OFFLINE-FIRST
-- Projeto: biz-flowcloud (Supabase)
-- Data: 2026-08-31
-- Escopo (apenas entidades do usuário, sincronizáveis pelo Android):
--   - Garantir updated_at em todas as entidades sincronizáveis
--   - Soft delete (deleted_at / tombstone) para sincronização de exclusões offline
--   - Índices justificados para consultas de sincronização
-- ============================================================

-- ------------------------------------------------------------
-- 1. documents (já possui updated_at) -> adicionar tombstone
-- ------------------------------------------------------------
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Índice de sincronização: buscar alterações de/para um usuário
CREATE INDEX IF NOT EXISTS idx_documents_user_updated
  ON public.documents(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_deleted_at
  ON public.documents(deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at
  ON public.documents(updated_at);

-- ------------------------------------------------------------
-- 2. transactions -> updated_at + tombstone
-- ------------------------------------------------------------
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_transactions_user_updated
  ON public.transactions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at
  ON public.transactions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transactions_updated_at
  ON public.transactions(updated_at);

-- ------------------------------------------------------------
-- 3. saved_clients -> updated_at + tombstone
-- ------------------------------------------------------------
ALTER TABLE public.saved_clients
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_saved_clients_user_updated
  ON public.saved_clients(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_clients_deleted_at
  ON public.saved_clients(deleted_at);

-- ------------------------------------------------------------
-- 4. saved_products -> updated_at + tombstone
-- ------------------------------------------------------------
ALTER TABLE public.saved_products
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_saved_products_user_updated
  ON public.saved_products(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_products_deleted_at
  ON public.saved_products(deleted_at);

-- ------------------------------------------------------------
-- 5. Triggers de updated_at para tabelas que não os tinham
--    (a função handle_updated_at já existe)
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at_transactions   ON public.transactions;
DROP TRIGGER IF EXISTS set_updated_at_saved_clients  ON public.saved_clients;
DROP TRIGGER IF EXISTS set_updated_at_saved_products ON public.saved_products;

CREATE TRIGGER set_updated_at_transactions
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_saved_clients
  BEFORE UPDATE ON public.saved_clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_saved_products
  BEFORE UPDATE ON public.saved_products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
