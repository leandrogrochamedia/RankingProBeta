-- ============================================================
-- PROOFLY — Simplificação do modelo cliente (Supervisor Master)
-- clients → client_profiles (1:1 com users via users.client_id)
-- Rode no SQL Editor do Supabase (idempotente)
-- ============================================================

-- 1) Renomear tabela (se ainda existir como clients)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_profiles'
  ) THEN
    ALTER TABLE public.clients RENAME TO client_profiles;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_profiles'
  ) THEN
    COMMENT ON TABLE public.client_profiles IS
      'Perfil 1:1 do cliente — dados ricos (endereço, preferências). Vinculado via users.client_id.';
  END IF;
END $$;

-- 2) FK em users (só se client_profiles existir após o rename)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS client_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_profiles'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_client_id_fkey;
    ALTER TABLE public.users
      ADD CONSTRAINT users_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES public.client_profiles(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_users_client_id ON public.users(client_id);
  END IF;
END $$;

-- 3) Backfill por e-mail (demo + cadastros existentes)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_profiles'
  ) THEN
    UPDATE public.users u
    SET client_id = cp.id
    FROM public.client_profiles cp
    WHERE u.client_id IS NULL
      AND cp.email IS NOT NULL
      AND u.email IS NOT NULL
      AND lower(trim(u.email)) = lower(trim(cp.email));
  END IF;
END $$;

-- 4) RLS / policies para client_profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_profiles'
  ) THEN
    ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS clients_anon_all ON public.client_profiles;
    DROP POLICY IF EXISTS client_profiles_anon_all ON public.client_profiles;
    CREATE POLICY client_profiles_anon_all ON public.client_profiles
      FOR ALL USING (true) WITH CHECK (true);
    GRANT ALL ON public.client_profiles TO anon, authenticated, service_role;
  END IF;
END $$;

-- 5) user_profiles deprecated
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    COMMENT ON TABLE public.user_profiles IS
      'DEPRECATED — Estrutura futura de multi-perfil. Não usar. Use users.client_id + users.professional_id + users.establishment_id.';
  END IF;
END $$;

-- 6) Conferência (funciona antes e depois do rename)
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_profiles')
      THEN (SELECT COUNT(*)::text FROM public.client_profiles)
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients')
      THEN (SELECT COUNT(*)::text FROM public.clients) || ' (tabela ainda é clients — rode o bloco 1 acima)'
    ELSE '0 — rode migrations/005_clients_cadastro.sql primeiro'
  END AS perfis_cliente,
  (SELECT COUNT(*) FROM public.users WHERE client_id IS NOT NULL) AS users_com_client_id,
  (SELECT COUNT(*) FROM public.users u
   WHERE u.role = 'cliente' AND u.client_id IS NULL) AS clientes_sem_vinculo;