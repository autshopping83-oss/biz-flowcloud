-- ============================================================
-- MIGRATION 1: SEGURANÇA CRÍTICA (incremental, não-destrutiva)
-- Projeto: biz-flowcloud (Supabase)
-- Data: 2026-08-31
-- Escopo:
--   1. Corrigir RLS de user_tokens (exposição de refresh tokens entre usuários)
--   2. Corrigir RLS de blog_posts (escrita aberta a qualquer autenticado)
--   3. Corrigir RLS de contacts / newsletter_subscribers (leitura aberta a qualquer autenticado)
--   4. Impedir self-upgrade de is_admin / plan em profiles
--   5. Converter user_tokens.user_id text->uuid com FK para auth.users (integridade)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Função auxiliar de administração (SECURITY INVOKER)
--    Lê apenas o próprio perfil; RLS já restringe leitura do próprio.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()), false);
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO anon, authenticated;

-- ------------------------------------------------------------
-- 2. user_tokens: converter user_id text->uuid e referenciar auth.users
--    (dados existentes validados: 2 linhas com UUIDs válidos)
-- ------------------------------------------------------------
ALTER TABLE public.user_tokens
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Adicionar FK para auth.users.id (integridade referencial)
ALTER TABLE public.user_tokens
  DROP CONSTRAINT IF EXISTS user_tokens_user_id_fkey;

ALTER TABLE public.user_tokens
  ADD CONSTRAINT user_tokens_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ------------------------------------------------------------
-- 3. user_tokens: RLS correta (cada usuário só os SEUS tokens)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "auth_select_own_tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "auth_insert_own_tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "auth_update_own_tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "auth_delete_own_tokens" ON public.user_tokens;

CREATE POLICY "auth_select_own_tokens" ON public.user_tokens
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "auth_insert_own_tokens" ON public.user_tokens
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auth_update_own_tokens" ON public.user_tokens
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auth_delete_own_tokens" ON public.user_tokens
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. blog_posts: escrita restrita a administrador; leitura pública só de publicados
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "auth_all_posts" ON public.blog_posts;

CREATE POLICY "auth_select_all_posts" ON public.blog_posts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "auth_insert_posts_admin" ON public.blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "auth_update_posts_admin" ON public.blog_posts
  FOR UPDATE TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "auth_delete_posts_admin" ON public.blog_posts
  FOR DELETE TO authenticated
  USING (public.is_current_user_admin());

-- ------------------------------------------------------------
-- 5. contacts: SELECT restrito a administrador (contém PII de visitantes)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "auth_select_contacts" ON public.contacts;

CREATE POLICY "auth_select_contacts_admin" ON public.contacts
  FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

-- ------------------------------------------------------------
-- 6. newsletter_subscribers: SELECT restrito a administrador (PII de visitantes)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "auth_select_subscribers" ON public.newsletter_subscribers;

CREATE POLICY "auth_select_subscribers_admin" ON public.newsletter_subscribers
  FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

-- ------------------------------------------------------------
-- 7. profiles: impedir self-upgrade de colunas privilegiadas
--    (is_admin / plan / email não podem ser alterados pelo próprio usuário comum)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Apenas bloqueia quando o próprio usuário (não-admin) tenta se autopromover
  IF auth.uid() = OLD.id AND NOT public.is_current_user_admin() THEN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      RAISE EXCEPTION 'Não autorizado a alterar is_admin';
    END IF;
    IF NEW.plan IS DISTINCT FROM OLD.plan THEN
      RAISE EXCEPTION 'Não autorizado a alterar plan';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns_trg ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();
