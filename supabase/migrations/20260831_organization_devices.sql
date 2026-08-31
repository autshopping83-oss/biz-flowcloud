-- ============================================================
-- MIGRATION 3: ORGANIZAÇÕES, MEMBROS E DISPOSITIVOS
-- Projeto: biz-flowcloud (Supabase)
-- Data: 2026-08-31
-- Escopo:
--   - Criar organizations (isolamento de negócio / multiusuário futuro)
--   - Criar organization_members (roles: owner, admin, member)
--   - Criar devices (gestão de instalações Android / sessões)
-- NOTA: Aditivo. As entidades de dados atuais permanecem isoladas por
--   user_id (equivalente a 1 organização por usuário). A camada de
--   organização fica disponível para evolução sem quebrar o schema atual.
-- ============================================================

-- ------------------------------------------------------------
-- 1. CRIAR TABELAS (ordem de dependência: members depende de organizations)
-- ------------------------------------------------------------

-- organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- organization_members
CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

-- devices
CREATE TABLE IF NOT EXISTS public.devices (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform     text NOT NULL DEFAULT 'android',
  app_version  text,
  last_seen_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  revoked_at   timestamptz
);

-- ------------------------------------------------------------
-- 2. RLS HABILITADO
-- ------------------------------------------------------------
ALTER TABLE public.organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices              ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 3. POLICIES organizations
-- ------------------------------------------------------------
CREATE POLICY "org_select_member" ON public.organizations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = id AND om.user_id = auth.uid()
  ));

CREATE POLICY "org_insert_creator" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "org_update_admin" ON public.organizations
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = id AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = id AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

-- ------------------------------------------------------------
-- 4. POLICIES organization_members
-- ------------------------------------------------------------
CREATE POLICY "om_select_own_org" ON public.organization_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_members me
    WHERE me.organization_id = organization_id AND me.user_id = auth.uid()
  ));

CREATE POLICY "om_insert_admin" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_id AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

CREATE POLICY "om_update_admin" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_id AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_id AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

CREATE POLICY "om_delete_admin" ON public.organization_members
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_id AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

-- ------------------------------------------------------------
-- 5. POLICIES devices
-- ------------------------------------------------------------
CREATE POLICY "devices_select_own" ON public.devices
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "devices_insert_own" ON public.devices
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "devices_update_own" ON public.devices
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "devices_delete_own" ON public.devices
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 6. INDICES
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_om_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_om_org  ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_user ON public.devices(user_id);

-- ------------------------------------------------------------
-- 7. TRIGGERS
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at_organizations ON public.organizations;
CREATE TRIGGER set_updated_at_organizations
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------
-- 8. GRANTS (padrão Supabase: expor CRUD via API para as roles)
-- ------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devices TO authenticated;
