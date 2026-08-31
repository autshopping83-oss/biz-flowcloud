-- ============================================================
-- MIGRATION 3b: AUTO-MEMBERSHIP DO CRIADOR DA ORGANIZAÇÃO (owner)
-- Projeto: biz-flowcloud (Supabase)
-- Data: 2026-08-31
-- Escopo: ao criar uma organização, o criador torna-se automaticamente
--   membro com role 'owner', garantindo o padrão dono->negócio.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_organization_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_organization_owner() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization_owner();
