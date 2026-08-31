-- ============================================================
-- MIGRATION 3c: FIX INFINITE RECURSION nas policies de organização
-- Projeto: biz-flowcloud (Supabase)
-- Data: 2026-08-31
-- Causa: policies que consultam organization_members dentro da própria
--   policy de organization_members entram em recursão infinita.
-- Correção: usar funções SECURITY DEFINER (search_path fixo) que leem
--   organization_members sem reaplicar RLS, eliminando a recursão.
-- ============================================================

-- ------------------------------------------------------------
-- Funções auxiliares (SECURITY DEFINER, sem recursão)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.org_member_role(p_org_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.organization_members
  WHERE organization_id = p_org_id AND user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.org_member_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.org_member_role(uuid) TO authenticated;

-- ------------------------------------------------------------
-- organizations: recriar policies sem recursão
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "org_select_member" ON public.organizations;
DROP POLICY IF EXISTS "org_update_admin"  ON public.organizations;

CREATE POLICY "org_select_member" ON public.organizations
  FOR SELECT TO authenticated
  USING (public.org_member_role(id) IS NOT NULL);

CREATE POLICY "org_update_admin" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.org_member_role(id) IN ('owner','admin'))
  WITH CHECK (public.org_member_role(id) IN ('owner','admin'));

-- ------------------------------------------------------------
-- organization_members: recriar policies sem recursão
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "om_select_own_org" ON public.organization_members;
DROP POLICY IF EXISTS "om_insert_admin"   ON public.organization_members;
DROP POLICY IF EXISTS "om_update_admin"   ON public.organization_members;
DROP POLICY IF EXISTS "om_delete_admin"   ON public.organization_members;

-- Membros podem ver os membros da próória organização (sem recursão)
CREATE POLICY "om_select_own_org" ON public.organization_members
  FOR SELECT TO authenticated
  USING (public.org_member_role(organization_id) IS NOT NULL);

-- Somente owner/admin da organização podem adicionar membros
CREATE POLICY "om_insert_admin" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (public.org_member_role(organization_id) IN ('owner','admin'));

CREATE POLICY "om_update_admin" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (public.org_member_role(organization_id) IN ('owner','admin'))
  WITH CHECK (public.org_member_role(organization_id) IN ('owner','admin'));

CREATE POLICY "om_delete_admin" ON public.organization_members
  FOR DELETE TO authenticated
  USING (public.org_member_role(organization_id) IN ('owner','admin'));
