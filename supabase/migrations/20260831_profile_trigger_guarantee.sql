-- ============================================================
-- MIGRATION: GARANTIA DE CRIAÇÃO ATÔMICA DO PROFILE NO SIGNUP
-- Projeto: biz-flowcloud (Supabase)
-- Data: 2026-08-31
--
-- CONTEXTO (auditoria):
--   O trigger on_auth_user_created (AFTER INSERT ON auth.users ->
--   handle_new_user()) JÁ EXISTE e está ATIVO no banco. A criação do
--   profile no signup já é atômica e idempotente via PK(id) e
--   ON CONFLICT. Esta migration NÃO recria a tabela nem altera dados
--   existentes; ela BLINDA e GARANTE o mecanismo:
--     1. Reforça a função handle_new_user p/ criação mínima e idempotente
--        (ON CONFLICT DO NOTHING), sem copiar dados desnecessários.
--     2. Remove privilégios EXECUTE excessivos (anon/authenticated) da
--        função SECURITY DEFINER (menor privilégio).
--     3. Garante o trigger habilitado.
--
-- COM PATOLOGIA: identidade inicial = auth.users.id (profiles.id).
--   Fields editáveis (company_name, etc.) continuam na app/backend.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Função handle_new_user: versão idempotente e mínima
--    - SECURITY DEFINER roda como postgres, SEM RLS, mas como o INSERT é
--      sempre para NEW.id (o id do próprio usuário recém-inserido em
--      auth.users), não há possibilidade de um usuário criar/alterar
--      profile de terceiros.
--    - ON CONFLICT (id) DO NOTHING => nunca cria 2 profiles p/ 1 user,
--      e não sobrescreve edições feitas pela app (syncProfile/settings).
--    - Não copia company_name/logo/etc. (campos editáveis e/ou não
--      presentes no raw_user_meta_data).
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, currency, language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'currency', 'MZN'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'pt')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- 2. Menor privilégio: revogar EXECUTE da função SECURITY DEFINER
--    de papéis de cliente. O trigger roda no contexto postgres e não
--    precisa que anon/authenticated consigam invocar a função.
-- ------------------------------------------------------------
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- ------------------------------------------------------------
-- 3. Garantir que o trigger esteja ativo (drop + recreate não destrutivo)
--    Fazemos upsert idempotente do trigger.
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
